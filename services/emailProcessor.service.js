const pdfParse = require('pdf-parse');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getLlmClient } = require('./llm/llm.factory');
const { appendExpenses, getCategories, appendIncome } = require('./googleSheets.service');
const pdfPasswords = require('../config/pdfPasswords');

function getConfigForFile(fileName) {
  console.log('Searching for config for file:', fileName);
  const name = fileName.toLowerCase();
  for (const config of pdfPasswords) {
    for (const keyword of config.keywords) {
      if (name.includes(keyword.toLowerCase())) {
        console.log(`Found config for keyword: ${keyword}`);
        return config;
      }
    }
  }
  return null; // Return null if no config is found
}

async function processPdfAttachment(file) {
  try {
    console.log(`Processing PDF attachment: ${file.originalname}`);
    let pdfText;
    const pdfConfig = getConfigForFile(file.originalname);

    try {
      // First attempt: parse without password to handle non-encrypted files
      const data = await pdfParse(file.buffer);
      pdfText = data.text;
    } catch (error) {
      // pdf-parse throws error with code 1 for encrypted files
      if (error.code === 1) { 
        console.log(`PDF ${file.originalname} is encrypted. Attempting to decrypt with qpdf...`);
        const password = pdfConfig ? String(pdfConfig.password) : null;

        if (password) {
          let tempDir;
          try {
            console.log("Found password, attempting decryption with command-line qpdf...");
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
            const inputPath = path.join(tempDir, file.originalname);
            const outputPath = path.join(tempDir, `decrypted-${file.originalname}`);

            fs.writeFileSync(inputPath, file.buffer);

            try {
              // Try qpdf decryption, even if it emits warnings
              execSync(`qpdf --password=${password} --decrypt "${inputPath}" "${outputPath}"`);
            } catch (error) {
              const stderr = error.stderr?.toString() || '';
              if (error.status === 3 && stderr.includes('WARNING')) {
                console.warn(`qpdf succeeded with warning: ${stderr}`);
                if (!fs.existsSync(outputPath)) {
                  console.error(`Decrypted output file not found despite qpdf warning.`);
                  return;
                }
              } else {
                throw error; // Re-throw real errors
              }
            }

            console.log("PDF decrypted successfully. Parsing text from decrypted buffer...");
            const decryptedBuffer = fs.readFileSync(outputPath);
            const data = await pdfParse(decryptedBuffer);
            pdfText = data.text;

          } catch (decryptionError) {
            console.error(`Failed to decrypt ${file.originalname} with qpdf CLI.`, decryptionError);
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

    // 3. Get LLM client and extract transactions
    console.log("Extracting transactions with LLM...");
    const llmClient = getLlmClient();
    const extractedTransactions = await llmClient.extractExpensesFromText(pdfText, categories);

    if (!extractedTransactions || extractedTransactions.length === 0) {
      console.log(`LLM did not find any transactions to log in ${file.originalname}.`);
      return;
    }

    const statementType = pdfConfig ? pdfConfig.statementType : null;

    // 4. Filter out inter-account payment transactions based on isPayment flag from LLM
    const filteredTransactions = extractedTransactions.filter(t => {
      // The LLM should provide the isPayment flag. Default to false if missing.
      const isPayment = t.isPayment === true;

      if (statementType === 'credit_card' && t.type?.toLowerCase() === 'credit' && isPayment) {
        console.log(`Ignoring credit card payment: ${t.description}`);
        return false;
      }
      if (statementType === 'bank_statement' && t.type?.toLowerCase() === 'debit' && isPayment) {
        console.log(`Ignoring bank debit for card payment: ${t.description}`);
        return false;
      }
      return true;
    });

    // 5. Separate into income and expenses
    const incomes = [];
    const expenses = [];
    if (statementType === 'bank_statement') {
      filteredTransactions.forEach(t => {
        if (t.type.toLowerCase() === 'credit') {
          incomes.push(t);
        } else {
          expenses.push(t);
        }
      });
    } else {
      // For credit cards or unknown types, everything is an expense/refund
      expenses.push(...filteredTransactions);
    }

    const today = new Date().toLocaleDateString();

    // 6. Process and log expenses
    if (expenses.length > 0) {
      const expensesToLog = expenses.map(expense => {
        const amount = expense.type && expense.type.toLowerCase() === 'credit' 
          ? -Math.abs(expense.amount) 
          : expense.amount;

        return {
          ...expense,
          amount,
          fileName: file.originalname,
          appendedDate: today,
          expenseType: expense.type,
        };
      });
      console.log("Logging expenses to Google Sheets...");
      await appendExpenses(expensesToLog);
    }

    // 7. Process and log income
    if (incomes.length > 0) {
      const incomeToLog = incomes.map(income => ({
        date: income.date,
        description: income.description,
        amount: income.amount,
        category: income.category,
        fileName: file.originalname,
        appendedDate: today,
      }));
      console.log("Logging income to Google Sheets...");
      await appendIncome(incomeToLog);
    }
    
    console.log(`Successfully processed and logged transactions for ${file.originalname}.`);

  } catch (error) {
    // This will catch any unexpected errors during processing
    console.error(`Error in processing PDF attachment for ${file.originalname}:`, error.message);
  }
}

module.exports = { processPdfAttachment };
