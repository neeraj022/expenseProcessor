const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
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
    let pdfDoc;

    // Use pdf-lib to load and decrypt the PDF if necessary
    try {
      // Attempt to load without a password
      pdfDoc = await PDFDocument.load(file.buffer);
    } catch (error) {
      // pdf-lib throws EncryptedPDFError if a password is required
      if (error.name === 'EncryptedPDFError') {
        console.log(`PDF ${file.originalname} is encrypted. Attempting to find password...`);
        const password = getPasswordForFile(file.originalname);

        if (password) {
          try {
            console.log("Found password. Retrying with password...");
            pdfDoc = await PDFDocument.load(file.buffer, { password });
          } catch (passwordError) {
            console.error(`Failed to decrypt ${file.originalname}. The password may be incorrect. Skipping.`);
            return; // Skip file if password is wrong
          }
        } else {
          console.error(`PDF ${file.originalname} is encrypted, but no password was found in config. Skipping.`);
          return;
        }
      } else {
        // It's some other PDF loading error, re-throw it
        throw error;
      }
    }

    // Save the (now decrypted) document to a new buffer
    const decryptedPdfBytes = await pdfDoc.save();

    // Use pdf-parse to extract text from the decrypted buffer
    data = await pdfParse(decryptedPdfBytes);

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
    // This will catch any unexpected errors during processing
    console.error(`Error in processing PDF attachment for ${file.originalname}:`, error.message);
  }
}

module.exports = { processPdfAttachment };
