const OpenAI = require('openai');
const LLMClient = require('../llm.client');

class OpenAIClient extends LLMClient {
  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractExpensesFromText(text, categories) {
    const validCategories = categories.join(', ');
    const prompt = `
          Analyze the following financial statement text and extract all expense and income transactions.
          Format the output as a JSON array of objects. Each object should have these exact keys: "date", "description", "amount", "type" (either "debit" or "credit"), and "category".
          The "date" must be in "MM/DD/YYYY" format.
          The "category" must be one of the following values: [${validCategories}].
          If a value is not present, use null.
          Text:
          ---
          ${text}
          ---
        `;

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
