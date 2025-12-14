const Anthropic = require('@anthropic-ai/sdk');
const LLMClient = require('../llm.client');
const { buildExtractionPrompt } = require('../prompt.builder');

class ClaudeClient extends LLMClient {
  constructor() {
    super();
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set in environment variables.");
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Allow model override via environment variable, default to Claude Sonnet 4.5
    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';
  }

  async extractExpensesFromText(text, expenseCategories, incomeCategories) {
    const prompt = buildExtractionPrompt(text, expenseCategories, incomeCategories);

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract the text content from the response
    const content = response.content[0].text;

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (error) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse Claude response as JSON: ${error.message}`);
      }
    }

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

module.exports = ClaudeClient;
