const { GoogleGenerativeAI } = require("@google/generative-ai");
const LLMClient = require('../llm.client');
const { buildExtractionPrompt } = require("../prompt.builder");

class GeminiClient extends LLMClient {
  constructor() {
    super();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    let content;
    try {
      content = JSON.parse(responseText);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON, attempting to repair...", error.message);
        const repairedJsonText = await this._repairJson(responseText);
        content = JSON.parse(repairedJsonText);
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

  // New helper: list models and pick latest flash model that supports generateContent,
  // otherwise pick any model that supports generateContent.
  async _selectModel(genAI) {
    console.log("Listing available Generative AI models...");
    let modelsResp;
    try {
      modelsResp = await genAI.listModels();
    } catch (err) {
      console.error("Failed to list models from Generative AI API:", err.message || err);
      throw new Error("Unable to list Generative AI models.");
    }

    const models = modelsResp.models || modelsResp; // be resilient to response shape
    if (!Array.isArray(models) || models.length === 0) {
      throw new Error("No models returned from listModels()");
    }

    // Normalize model entries and provide helper accessors.
    const normalized = models.map(m => ({
      raw: m,
      id: m.name || m.model || m.id || m.displayName || '',
      displayName: m.displayName || m.name || m.model || '',
      supportedMethods: m.supportedMethods || (m.methods ? m.methods : []),
    }));

    // Filter models that support generateContent
    const generateCapable = normalized.filter(m => {
      const methods = (m.supportedMethods || []).map(String);
      return methods.includes('generateContent') || methods.includes('generate') || methods.includes('generate_text');
    });

    // Try to pick a "flash" model first
    const flashCandidates = generateCapable.filter(m => /flash/i.test(m.displayName + m.id));
    let chosen = null;

    if (flashCandidates.length > 0) {
      // Prefer the one with the highest version-like suffix in the id (best-effort)
      flashCandidates.sort((a, b) => {
        // extract numeric sequences to compare, fallback to string compare
        const numA = (a.id.match(/(\d+(\.\d+)?)/) || ['0'])[0];
        const numB = (b.id.match(/(\d+(\.\d+)?)/) || ['0'])[0];
        return parseFloat(numB) - parseFloat(numA);
      });
      chosen = flashCandidates[0];
    } else if (generateCapable.length > 0) {
      // fallback to any generateContent-capable model
      chosen = generateCapable[0];
    }

    if (!chosen) {
      console.error("No model supporting generation found. Available models:", normalized.map(m => m.id));
      throw new Error("No suitable generative model found that supports generateContent.");
    }

    console.log("Selected model for generation:", chosen.id);

    // Create the generative model instance using the chosen id.
    const modelInstance = genAI.getGenerativeModel({
      model: chosen.id,
      generationConfig: {
        response_mime_type: "application/json",
      },
    });

    return modelInstance;
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
    console.log("JSON repair attempt finished.");
    return repairedJsonText;
  }
}

module.exports = GeminiClient;
