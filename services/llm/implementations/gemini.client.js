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
      model: "gemini-1.5-pro-latest",
      generationConfig: {
        response_mime_type: "application/json",
      },
    });
  }

  async extractExpensesFromText(text, categories) {
    const validCategories = categories.join(', ');
    const prompt = `
          Analyze the following financial statement text and extract all expense and income transactions.
          Format the output as a JSON object. The JSON object should have a single key, "expenses", which contains an array of objects. Each object should have these exact keys: "date", "description", "amount", "type" (either "debit" or "credit"), and "category".
          The "category" MUST be one of the following values: [${validCategories}].
          If a value is not present, use null.
          Text:
          ---
          ${text}
          ---
        `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const content = JSON.parse(responseText);
    // The model might return a root object with an "expenses" key, so handle that.
    return content.expenses || content;
  }
}

module.exports = GeminiClient;
