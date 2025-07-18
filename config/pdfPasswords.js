module.exports = [
  {
    keywords: ['idfc'],
    password: process.env.PDF_PASSWORD_IDFC,
  },
  {
    keywords: ['chase'],
    password: process.env.PDF_PASSWORD_CHASE,
  },
  // Add more configurations here as needed. For example:
  // {
  //   keywords: ['sbi', 'state bank of india'],
  //   password: process.env.PDF_PASSWORD_SBI,
  // },
].filter(p => p.password); // This ensures we only use configs where a password is set in .env
