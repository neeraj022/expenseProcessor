const pdfPasswords = {};

for (const key in process.env) {
  if (key.startsWith('PDF_PASSWORD_')) {
    const identifier = key.replace('PDF_PASSWORD_', '').toLowerCase();
    pdfPasswords[identifier] = process.env[key];
  }
}

module.exports = pdfPasswords;
