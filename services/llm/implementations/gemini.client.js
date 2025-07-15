const LLMClient = require('../llm.client');

class GeminiClient extends LLMClient {
  constructor() {
    super();
    // TODO: Initialize Gemini client using process.env.GEMINI_API_KEY
  }

  async extractExpensesFromText(text) {
    // TODO: Implement expense extraction logic using the Gemini API
    throw new Error("GeminiClient.extractExpensesFromText() is not yet implemented.");
  }
}

module.exports = GeminiClient;
