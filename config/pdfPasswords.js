module.exports = [
  {
    keywords: ['idfcCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_IDFC,
    statementType: 'credit_card',
    useColumnLayout: true
  },
  {
    keywords: ['idfcBank'],
    password: process.env.PDF_PASSWORD_BANK_IDFC,
    statementType: 'bank_statement',
    useColumnLayout: true
  },
  {
    keywords: ['iciciRubyxCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_ICICI_RUBYX,
    statementType: 'credit_card',
    useColumnLayout: true,
    pagesToParse: 2,
  },
  {
    keywords: ['iciciAmazonCreditCard', 'amazon'],
    password: process.env.PDF_PASSWORD_CREDIT_ICICI_AMAZON,
    statementType: 'credit_card',
    useColumnLayout: true,
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
    useColumnLayout: true,
    pagesToParse: 2,
  },
  {
    keywords: ['sbiBankNeeraj'],
    password: process.env.PDF_PASSWORD_BANK_NEERAJ_SBI,
    statementType: 'bank_statement',
    useColumnLayout: true
  },
  {
    keywords: ['sbiBank'],
    password: process.env.PDF_PASSWORD_BANK_SBI,
    statementType: 'bank_statement',
    useColumnLayout: true
  },
  {
    keywords: ['bobCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_BOB,
    statementType: 'credit_card',
    useColumnLayout: true,
  },
  {
    keywords: ['equitasBank'],
    password: process.env.PDF_PASSWORD_BANK_EQUITAS,
    statementType: 'bank_statement',
    useColumnLayout: true
  },
  {
    keywords: ['scapiaFederalCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_SCAPIA_FEDERAL, // no password by default
    statementType: 'credit_card',
    useColumnLayout: true
  },
].filter(p => p.password); // This ensures we only use configs where a password is set in .env
