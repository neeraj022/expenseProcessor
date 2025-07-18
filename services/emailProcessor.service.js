const pdfParse = require('pdf-parse');
const { Recipe } = require('hummus-recipe');
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
    let pdfText;

    try {
      // First attempt: parse directly, for unencrypted PDFs
      const data = await pdfParse(file.buffer);
      pdfText = data.text;
    } catch (error) {
      // If initial parsing fails, assume encryption and try to decrypt with hummus-recipe
      console.log(`Initial parsing failed for ${file.originalname}, attempting decryption...`);
      const password = getPasswordForFile(file.originalname);

      if (password) {
        console.log("Found password, using hummus-recipe to decrypt...");
        try {
          // Create a new PDF in memory by re-saving the encrypted one with the password
          const recipe = new Recipe(file.buffer, null, { password });
          recipe.endPDF(); // This finalizes the new PDF buffer
          const decryptedPdfBuffer = recipe.toBuffer();

          // Now parse the new, decrypted buffer
          const data = await pdfParse(decryptedPdfBuffer);
          pdfText = data.text;
        } catch (hummusError) {
          console.error(`Hummus-recipe failed for ${file.originalname}. The password may be incorrect.`, hummusError.message);
          return; // Skip this file
        }
      } else {
        console.error(`PDF ${file.originalname} appears to be encrypted, but no password was found. Skipping.`);
        return;
      }
    }

    if (!pdfText || !pdfText.trim()) {
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
    // This will catch any unexpected errors during processing
    console.error(`Error in processing PDF attachment for ${file.originalname}:`, error.message);
  }
}

module.exports = { processPdfAttachment };
