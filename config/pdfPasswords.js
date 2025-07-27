module.exports = [
  {
    keywords: ['idfcCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_IDFC,
  },
  {
    keywords: ['idfcBank'],
    password: process.env.PDF_PASSWORD_BANK_IDFC,
  },
  {
    keywords: ['iciciRubyxCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_ICICI_RUBYX,
  },
  {
    keywords: ['iciciAmazonCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_ICICI_AMAZON,
  },
  {
    keywords: ['iciciBank'],
    password: process.env.PDF_PASSWORD_BANK_ICICI,
  },
  {
    keywords: ['sbiCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_SBI,
  },
  {
    keywords: ['sbiBank'],
    password: process.env.PDF_PASSWORD_BANK_SBI,
  },
  {
    keywords: ['bobCreditCard'],
    password: process.env.PDF_PASSWORD_CREDIT_BOB,
  },
  // Add more configurations here as needed. For example:
  // {
  //   keywords: ['sbi', 'state bank of india'],
  //   password: process.env.PDF_PASSWORD_SBI,
  // },
].filter(p => p.password); // This ensures we only use configs where a password is set in .env
