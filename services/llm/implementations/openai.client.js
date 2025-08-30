const OpenAI = require('openai');
const LLMClient = require('../llm.client');
const { buildExtractionPrompt } = require('../prompt.builder');

class OpenAIClient extends LLMClient {
  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractExpensesFromText(text, expenseCategories, incomeCategories) {
    const prompt = buildExtractionPrompt(text, expenseCategories, incomeCategories);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-1106-preview", // Or any model that supports JSON mode
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);
    // The model might return a root object with an "expenses" key, so handle that.
    const expenses = result.expenses || result;

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
}

module.exports = OpenAIClient;
