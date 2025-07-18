const pdf = require('pdf-parse');
const { getLlmClient } = require('./llm/llm.factory');
const { appendExpenses, getCategories } = require('./googleSheets.service');
const pdfPasswords = require('../config/pdfPasswords');

function getPasswordForFile(filename) {
  const name = filename.toLowerCase();
  for (const identifier in pdfPasswords) {
    if (name.includes(identifier)) {
      console.log(`Found password for identifier: ${identifier}`);
      return pdfPasswords[identifier];
    }
  }
  return ''; // Return empty string for pdf-parse if no password is found
}

async function processPdfAttachment(file) {
  try {
    console.log(`Processing PDF attachment: ${file.originalname}`);

    // 1. Get password and extract text from PDF
    const password = getPasswordForFile(file.originalname);
    const options = { password };
    
    const data = await pdf(file.buffer, options).catch(err => {
      if (err && err.message && err.message.toLowerCase().includes('password')) {
        console.error(`Incorrect or missing password for ${file.originalname}. Skipping.`);
        return null; // Indicates a password error
      }
      throw err; // Re-throw other errors
    });

    // If data is null, it means there was a password error.
    if (data === null) {
      return;
    }

    const pdfText = data.text;

    if (!pdfText.trim()) {
      console.log(`PDF contains no text. Skipping ${file.originalname}.`);
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
      console.log(`LLM did not find any expenses to log in ${file.originalname}.`);
      return;
    }

    // 4. Append to Google Sheets
    console.log("Logging expenses to Google Sheets...");
    await appendExpenses(extractedExpenses);
    
    console.log(`Successfully processed and logged expenses for ${file.originalname}.`);
  } catch (error) {
    console.error(`Error in processing PDF attachment for ${file.originalname}:`, error);
  }
}

module.exports = { processPdfAttachment };
