class LLMClient {
  constructor() {
    if (this.constructor === LLMClient) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  async extractExpensesFromText(text) {
    throw new Error("Method 'extractExpensesFromText()' must be implemented.");
  }
}

module.exports = LLMClient;
