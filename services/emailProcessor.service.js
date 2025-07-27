const pdfParse = require('pdf-parse');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getLlmClient } = require('./llm/llm.factory');
const { appendExpenses, getCategories } = require('./googleSheets.service');
const pdfPasswords = require('../config/pdfPasswords');

function getPasswordForFile(fileName) {
  const name = fileName.toLowerCase();
  for (const config of pdfPasswords) {
    for (const keyword of config.keywords) {
      if (name.includes(keyword.toLowerCase())) {
        console.log(`Found password config for keyword: ${keyword}`);
        return String(config.password);
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
      // First attempt: parse without password to handle non-encrypted files
      const data = await pdfParse(file.buffer);
      pdfText = data.text;
    } catch (error) {
      // pdf-parse throws error with code 1 for encrypted files
      if (error.code === 1) { 
        console.log(`PDF ${file.originalname} is encrypted. Attempting to decrypt with qpdf...`);
        const password = getPasswordForFile(file.originalname);

        if (password) {
          let tempDir;
          try {
            console.log("Found password, attempting decryption with command-line qpdf...");
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
            const inputPath = path.join(tempDir, file.originalname);
            const outputPath = path.join(tempDir, `decrypted-${file.originalname}`);

            fs.writeFileSync(inputPath, file.buffer);

            // Note: This requires the qpdf command-line tool to be installed and in the system's PATH.
            execSync(`qpdf --password=${password} --decrypt "${inputPath}" "${outputPath}"`);

            console.log("PDF decrypted successfully. Parsing text from decrypted buffer...");
            const decryptedBuffer = fs.readFileSync(outputPath);
            const data = await pdfParse(decryptedBuffer);
            pdfText = data.text;

          } catch (decryptionError) {
            console.error(`Failed to decrypt ${file.originalname} with qpdf CLI. The password may be incorrect or qpdf is not installed in the system's PATH.`, decryptionError);
            return; // Skip file if decryption fails
          } finally {
            // Clean up temp files
            if (tempDir && fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true });
              console.log("Cleaned up temporary files.");
            }
          }
        } else {
          console.error(`PDF ${file.originalname} is encrypted, but no password was found. Skipping.`);
          return;
        }
      } else {
        // Some other parsing error
        console.error(`Failed to parse PDF ${file.originalname}:`, error.message);
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

    const today = new Date().toLocaleDateString();
    const expensesToLog = extractedExpenses.map(expense => {
      // Make amount negative for credits
      const amount = expense.type && expense.type.toLowerCase() === 'credit' 
        ? -Math.abs(expense.amount) 
        : expense.amount;
      
      // Combine metadata into a notes string
      const notes = `Appended on: ${today}, File: ${file.originalname}, Type: ${expense.type}`;

      return {
        ...expense,
        amount,
        notes,
      };
    });

    // 4. Append to Google Sheets
    console.log("Logging expenses to Google Sheets...");
    await appendExpenses(expensesToLog);
    
    console.log(`Successfully processed and logged expenses for ${file.originalname}.`);
  } catch (error) {
    // This will catch any unexpected errors during processing
    console.error(`Error in processing PDF attachment for ${file.originalname}:`, error.message);
  }
}

module.exports = { processPdfAttachment };
