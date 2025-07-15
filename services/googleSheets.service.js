const { google } = require('googleapis');
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(process.cwd(), process.env.GOOGLE_CREDENTIALS_PATH);

let authClient;

async function getAuthClient() {
  if (authClient) return authClient;
  authClient = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  return authClient;
}

async function appendExpenses(expenses) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const values = expenses.map(e => [e.date, e.description, e.amount, e.type, e.category]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:E', // Adjust sheet name and range as needed
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
  console.log(`${values.length} expenses appended to Google Sheet.`);
}

module.exports = { appendExpenses };
