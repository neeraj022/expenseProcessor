const { google } = require('googleapis');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(process.cwd(), process.env.GOOGLE_CREDENTIALS_PATH);

let authClient;

async function getAuthClient() {
  if (authClient) return authClient;
   authClient = new google.auth.GoogleAuth({                                                                         
    scopes: SCOPES,                                                                                                 
    keyFile: CREDENTIALS_PATH,                                                                                      
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

async function appendExpenses(expenses) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const values = expenses.map(e => [e.date, e.description, e.amount, e.category, e.type]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'API_TEST!B:F', //'Expenses!B:F', // Adjust sheet name and range as needed
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
  });
  console.log(`${values.length} expenses appended to Google Sheet.`);
}

module.exports = { appendExpenses, getCategories };
