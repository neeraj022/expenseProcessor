module.exports = [
  {
    keywords: ['idfcCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_IDFC,
    statementType: 'credit_card',
    pagesToParse: 2,
  },
  {
    keywords: ['idfcBank'],
    password: process.env.PDF_PASSWORD_BANK_IDFC,
    statementType: 'bank_statement',
  },
  {
    keywords: ['iciciRubyxCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_ICICI_RUBYX,
    statementType: 'credit_card',
    pagesToParse: 2,
  },
  {
    keywords: ['iciciAmazonCreditCard', 'amazon'],
    password: process.env.PDF_PASSWORD_CREDIT_ICICI_AMAZON,
    statementType: 'credit_card',
    useColumnLayout: true,
    pagesToParse: 2,
  },
  {
    keywords: ['iciciBank'],
    password: process.env.PDF_PASSWORD_BANK_ICICI,
    statementType: 'bank_statement',
  },
  {
    keywords: ['sbiCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_SBI,
    statementType: 'credit_card',
    pagesToParse: 2,
  },
  {
    keywords: ['sbiBankNeeraj'],
    password: process.env.PDF_PASSWORD_BANK_NEERAJ_SBI,
    statementType: 'bank_statement',
  },
  {
    keywords: ['sbiBank'],
    password: process.env.PDF_PASSWORD_BANK_SBI,
    statementType: 'bank_statement',
  },
  {
    keywords: ['bobCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_BOB,
    statementType: 'credit_card',
    pagesToParse: 3,
  },
].filter(p => p.password); // This ensures we only use configs where a password is set in .env
