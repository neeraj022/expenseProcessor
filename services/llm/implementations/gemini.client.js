const { GoogleGenerativeAI } = require("@google/generative-ai");
const LLMClient = require('../llm.client');

class GeminiClient extends LLMClient {
  constructor() {
    super();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        response_mime_type: "application/json",
      },
    });
  }
  async extractExpensesFromText(text, categories) {
    const validCategories = categories.join(', ');
    const prompt = `
          Analyze the following financial statement text and extract all expense and income transactions.
          This includes regular purchases, refunds, income deposits, and payments made to credit cards.
          Format the output as a JSON object. The JSON object should have a single key, "expenses", which contains an array of objects. Each object should have these exact keys: "date", "description", "amount", "type" (either "debit" or "credit"), and "category".
          The "date" must be in "MM/DD/YYYY" format.
          The "category" MUST be one of the following values: [${validCategories}].
          "debit" represents money spent or transferred out. "credit" represents money received or returned.
          On bank statements, credits are often income. Income descriptions may include 'RDA Vostro FIR', 'NIUM PTE L', 'dividend', 'Uengage', or 'INDOFAST SWAP EN'.
          On credit card statements, credits can be payments (e.g., "Payment Received, Thank You") or refunds. Extract both.
          If a value is not present, use null.
          Sometimes the reward point column is also present next to the amount column, but it should not be considered in the output.
          Amount can't be larger than 1000000.
          Text:
          ---
          ${text}
          ---
        `;

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

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const repairedJsonText = response.text();
    console.log("JSON repair attempt finished.");
    return repairedJsonText;
  }
}

module.exports = GeminiClient;
