const pdf = require('pdf-parse');
const { getLlmClient } = require('./llm/llm.factory');
const { appendExpenses, getCategories } = require('./googleSheets.service');
const pdfPasswords = require('../config/pdfPasswords');

function getPasswordForFile(fileName) {
  const name = fileName.toLowerCase();
  for (const config of pdfPasswords) {
    for (const keyword of config.keywords) {
      if (name.includes(keyword.toLowerCase())) {
        console.log(`Found password config for keyword: ${keyword}`);
        return config.password;
      }
    }
  }
  return null; // Return null if no password is found
}

async function processPdfAttachment(file) {
  try {
    console.log(`Processing PDF attachment: ${file.originalname}`);
    let data;

    // Attempt to parse without a password first for unencrypted PDFs
    try {
      data = await pdf(file.buffer);
    } catch (error) {
      // pdf-parse throws an error with this message for encrypted files
      if (error && error.message && error.message.includes('No password given')) {
        console.log("PDF is encrypted. Attempting to find password...");
        const password = getPasswordForFile(file.originalname);

        if (password) {
          console.log("Found password. Retrying parsing...");
          const options = { password };
          data = await pdf(file.buffer, options);
        } else {
          console.error(`PDF ${file.originalname} is encrypted, but no password was found in config. Skipping.`);
          return; // Skip this file
        }
      } else {
        // It's some other parsing error, re-throw it to be caught by the outer block
        throw error;
      }
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
    // This will catch incorrect passwords ("Invalid password") or other unexpected errors
    console.error(`Error in processing PDF attachment for ${file.originalname}:`, error.message);
  }
}

module.exports = { processPdfAttachment };
