const pdf = require('pdf-parse');
const { getLlmClient } = require('./llm/llm.factory');
const { appendExpenses, getCategories } = require('./googleSheets.service');

async function processPdfAttachment(fileBuffer) {
  try {
    console.log("Processing PDF attachment...");
    // 1. Extract text from PDF buffer
    const data = await pdf(fileBuffer);
    const pdfText = data.text;

    if (!pdfText.trim()) {
      console.log("PDF contains no text. Skipping.");
      return;
    }

    // 2. Get categories from Google Sheet
    console.log("Fetching categories from Google Sheet...");
    const categories = await getCategories();
    if (!categories || categories.length === 0) {
      console.log("No categories found in sheet. Aborting.");
      return;
    }

    // 3. Get LLM client and extract expenses
    console.log("Extracting expenses with LLM...");
    const llmClient = getLlmClient();
    const extractedExpenses = await llmClient.extractExpensesFromText(pdfText, categories);

    if (!extractedExpenses || extractedExpenses.length === 0) {
      console.log("LLM did not find any expenses to log.");
      return;
    }

    // 4. Append to Google Sheets
    console.log("Logging expenses to Google Sheets...");
    await appendExpenses(extractedExpenses);
    
    console.log("Successfully processed and logged expenses.");
  } catch (error) {
    console.error("Error in processing PDF attachment:", error);
  }
}

module.exports = { processPdfAttachment };
