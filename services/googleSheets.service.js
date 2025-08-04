const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let authClient;

async function getAuthClient() {
  if (authClient) return authClient;

  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_CREDENTIALS environment variable not set.');
  }

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  authClient = new google.auth.GoogleAuth({
    scopes: SCOPES,
    credentials,
  });
  return authClient;
}

async function getCategories() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Category Setup!B3:B40',
  });

  const values = response.data.values;
  if (values && values.length) {
    // Flatten the array of arrays and filter out any empty rows
    return values.map(row => row[0]).filter(Boolean);
  }
  return [];
}  

async function appendIncome(incomes) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const values = incomes.map(i => [i.date, i.description, i.amount, i.category, i.fileName, i.appendedDate]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Income!B:G', // Target Income sheet
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
  console.log(`${values.length} income transactions appended to Google Sheet.`);
}

async function appendExpenses(expenses) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const values = expenses.map(e => [e.date, e.description, e.amount, e.category, e.fileName, e.appendedDate, e.expenseType]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Expenses!B:H', // Adjust sheet name and range as needed
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
  console.log(`${values.length} expenses appended to Google Sheet.`);
}

module.exports = { appendExpenses, getCategories, appendIncome };
