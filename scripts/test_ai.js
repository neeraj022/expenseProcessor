// Simple test runner for LLM extraction functionality.
// Usage examples (shell):
//   LLM_PROVIDER=openai OPENAI_API_KEY=... node scripts/test_ai.js
//   LLM_PROVIDER=gemini GEMINI_API_KEY=... node scripts/test_ai.js
//   LLM_PROVIDER=claude ANTHROPIC_API_KEY=... node scripts/test_ai.js

require('dotenv').config();
const { getLlmClient } = require('../services/llm/llm.factory');

(async () => {
  try {
    // Allow provider override via first CLI arg for convenience
    const cliProvider = process.argv[2];
    if (cliProvider) process.env.LLM_PROVIDER = cliProvider;

    if (!process.env.LLM_PROVIDER) {
      console.error("Set LLM_PROVIDER (openai, gemini, or claude).");
      process.exit(1);
    }

    // Minimal warnings for missing API keys
    if (process.env.LLM_PROVIDER.toLowerCase() === 'openai' && !process.env.OPENAI_API_KEY) {
      console.warn("Warning: OPENAI_API_KEY not set.");
    }
    if (process.env.LLM_PROVIDER.toLowerCase() === 'gemini' && !process.env.GEMINI_API_KEY) {
      console.warn("Warning: GEMINI_API_KEY not set.");
    }
    if (process.env.LLM_PROVIDER.toLowerCase() === 'claude' && !process.env.ANTHROPIC_API_KEY) {
      console.warn("Warning: ANTHROPIC_API_KEY not set.");
    }

    const client = getLlmClient();

    // Sample input to exercise extraction
    const sampleText = [
      "10-19-2025 - Starbucks - $5.75 - coffee",
      "10-20-2025 - ACME Supermarket - $123.45 - groceries",
      "10-21-2025 - Payroll - +$2,500.00 - salary"
    ].join('\n');

    const expenseCategories = ["coffee", "groceries", "transportation", "dining"];
    const incomeCategories = ["salary", "refund", "bonus"];

    console.log("Sending sample text to LLM for extraction...");
    const expenses = await client.extractExpensesFromText(sampleText, expenseCategories, incomeCategories);

    console.log("Extraction result:", expenses);
    console.log(JSON.stringify(expenses, null, 2));
  } catch (err) {
    console.error("Test failed:", err && err.message ? err.message : err);
    process.exitCode = 2;
  }
})();
