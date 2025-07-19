const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
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

async function extractTextFromPdf(doc) {
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

async function processPdfAttachment(file) {
  try {
    console.log(`Processing PDF attachment: ${file.originalname}`);
    let pdfText;
    const pdfData = new Uint8Array(file.buffer);
    let doc;

    try {
      // First attempt: load without password
      doc = await pdfjs.getDocument({ data: pdfData }).promise;
    } catch (error) {
      // pdf.js throws an exception with name 'PasswordException' for encrypted files
      if (error.name === 'PasswordException') {
        console.log(`PDF ${file.originalname} is encrypted. Attempting to find password...`);
        const password = getPasswordForFile(file.originalname);
        if (password) {
          try {
            console.log("Found password, retrying with password...");
            doc = await pdfjs.getDocument({ data: pdfData, password: password }).promise;
          } catch (passwordError) {
            console.error(`Failed to load ${file.originalname} with password. The password may be incorrect.`);
            return; // Skip file if password is wrong
          }
        } else {
          console.error(`PDF ${file.originalname} is encrypted, but no password was found. Skipping.`);
          return;
        }
      } else {
        console.error(`Failed to load PDF ${file.originalname}:`, error.message);
        return; // Some other error
      }
    }
    
    pdfText = await extractTextFromPdf(doc);

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
