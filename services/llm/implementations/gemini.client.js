const genaiModule = require("@google/genai");
const LLMClient = require('../llm.client');
const { buildExtractionPrompt } = require("../prompt.builder");

class GeminiClient extends LLMClient {
  constructor() {
    super();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }

    // Robustly instantiate the genAI client regardless of package export shape.
    const key = process.env.GEMINI_API_KEY;
    let genAI;
    const m = genaiModule;

    if (typeof m === 'function') {
      // try constructor with object first (new GoogleGenAI({apiKey}))
      try {
        genAI = new m({ apiKey: key });
      } catch (err) {
        // fallback attempts
        try { genAI = new m(key); } catch (err2) {
          if (typeof m.createClient === 'function') {
            genAI = m.createClient({ apiKey: key });
          } else if (m.default && typeof m.default === 'function') {
            genAI = new m.default({ apiKey: key });
          } else {
            throw new Error("Unable to instantiate @google/genai client from function export.");
          }
        }
      }
    } else if (m && typeof m.GoogleGenAI === 'function') {
      genAI = new m.GoogleGenAI({ apiKey: key });
    } else if (m && typeof m.GenAI === 'function') {
      // older/alternate export
      try {
        genAI = new m.GenAI({ apiKey: key });
      } catch (e) {
        genAI = new m.GenAI(key);
      }
    } else if (m && typeof m.createClient === 'function') {
      genAI = m.createClient({ apiKey: key });
    } else if (m && m.default && typeof m.default === 'function') {
      genAI = new m.default({ apiKey: key });
    } else {
      throw new Error("Unsupported @google/genai export shape; cannot instantiate client. Check package version.");
    }

    // Initialize model selection asynchronously and store the promise so other methods can await it.
    this._initPromise = this._selectModel(genAI).then(modelInstance => {
      this.model = modelInstance;
    });
  }

  async extractExpensesFromText(text, expenseCategories, incomeCategories) {
    // Ensure model selection completed
    if (this._initPromise) {
      await this._initPromise;
    }

    const prompt = buildExtractionPrompt(text, expenseCategories, incomeCategories);

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Log raw response and attempt to extract a clean JSON substring
    //console.log("Raw model response text:", responseText);
    const jsonCandidate = this._extractJsonFromText(responseText);
    console.log("Extracted JSON candidate:", jsonCandidate);

    let content;
    try {
      content = JSON.parse(jsonCandidate);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON, attempting to repair...", error.message);
        const repairedJsonText = await this._repairJson(jsonCandidate);
        const sanitized = this._extractJsonFromText(repairedJsonText);
        console.log("Sanitized repaired JSON:", sanitized);
        content = JSON.parse(sanitized);
      } else {
        throw error;
      }
    }

    // The model might return a root object with an "expenses" key, so handle that.
    const expenses = content.expenses || content;

    // Format date from MM-DD-YYYY to MM/DD/YYYY
    if (Array.isArray(expenses)) {
      expenses.forEach(expense => {
        if (expense.date && typeof expense.date === 'string') {
          // Replaces all hyphens with slashes
          expense.date = expense.date.replace(/-/g, '/');
        }
      });
    }

    return expenses;
  }

  // Helper: extract JSON substring from a larger string (handles fenced blocks and stray prefix/suffix)
  _extractJsonFromText(text) {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();

    // 1) Look for fenced code block with optional json language
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      return fenceMatch[1].trim();
    }

    // 2) Find first JSON opening char
    const start = trimmed.search(/[\{\[]/);
    if (start === -1) {
      // no obvious JSON start, return original trimmed text
      return trimmed;
    }

    // Scan forward to find the matching closing bracket while ignoring strings and escapes
    let stack = [];
    let inString = null;
    let escape = false;
    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"' || ch === "'") {
        if (!inString) {
          inString = ch;
        } else if (inString === ch) {
          inString = null;
        }
        continue;
      }
      if (inString) continue;

      if (ch === '{' || ch === '[') {
        stack.push(ch);
        continue;
      }
      if (ch === '}' || ch === ']') {
        const last = stack.pop();
        if (!last) continue;
        const matches = (last === '{' && ch === '}') || (last === '[' && ch === ']');
        if (!matches) continue;
        if (stack.length === 0) {
          // return substring from first opening to this closing
          return trimmed.slice(start, i + 1).trim();
        }
      }
    }

    // If we didn't find a matching close, return from start to end as fallback
    return trimmed.slice(start).trim();
  }

  // New helper: pick model from env or fallback to gemini-2.0-flash.
  async _selectModel(genAI) {
    console.log("Selecting Generative AI model (env override or gemini-2.0-flash fallback)...");

    const chosenId = process.env.GEMINI_MODEL || 'models/gemini-2.0-flash';
    console.log("Chosen model for generation:", chosenId, "(override with GEMINI_MODEL)");

    // Preferred: SDK provides a generative model object
    if (typeof genAI.getGenerativeModel === 'function') {
      return genAI.getGenerativeModel({
        model: chosenId,
        generationConfig: { response_mime_type: "application/json" },
      });
    }

    // Newer shape: ai.models.generateContent({...})
    if (genAI.models && typeof genAI.models.generateContent === 'function') {
      return {
        async generateContent(prompt) {
          const resp = await genAI.models.generateContent({
            model: chosenId,
            contents: prompt,
          });
          // Normalize response to { response: { text: () => string } }
          const textVal = (typeof resp.text === 'function') ? resp.text() : (resp.text ?? (resp.output?.[0]?.content ?? ''));
          return { response: { text: () => textVal } };
        }
      };
    }

    // Fallback: genAI.generate(...)
    if (typeof genAI.generate === 'function') {
      return {
        async generateContent(prompt) {
          const resp = await genAI.generate({ model: chosenId, prompt });
          const textVal = (typeof resp.text === 'function') ? resp.text() : (resp.text ?? (resp.output?.[0]?.content ?? ''));
          return { response: { text: () => textVal } };
        }
      };
    }

    throw new Error("No suitable generation method available on genAI instance.");
  }

  async _repairJson(malformedJson) {
    console.log("Attempting to repair malformed JSON...");
    const prompt = `
          The following string is a malformed JSON. Please fix it and return only the valid JSON object.
          Do not add any explanations or introductory text. Just return the corrected JSON.

          Malformed JSON:
          ---
          ${malformedJson}
          ---
        `;

    // Ensure model selection completed before using it for repair
    if (this._initPromise) {
      await this._initPromise;
    }

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const repairedJsonText = response.text();
    // Sanitize repaired output in case model added fences or surrounding text
    const sanitized = this._extractJsonFromText(repairedJsonText);
    console.log("JSON repair attempt finished. Sanitized output:", sanitized);
    return sanitized;
  }
}

module.exports = GeminiClient;
