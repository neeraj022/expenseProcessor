const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function resolveMonthlyEnv(baseName) {
  // Prefer a single base env that can contain one or more comma-separated passwords.
  // Example: PDF_PASSWORD_CREDIT_SCAPIA_FEDERAL="pass_jun,pass_may,pass_apr"
  const baseVal = process.env[baseName];
  if (baseVal) {
    const parts = baseVal.split(',').map(s => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts : undefined;
  }

  // Fallback: collect preferred current/previous month variants and any suffixed envs
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pad = n => String(n).padStart(2, '0');

  const buildVariants = date => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const short = MONTH_SHORT[date.getMonth()];
    const long = date.toLocaleString('en-US', { month: 'long' });
    return [
      `${y}_${pad(m)}`,
      `${y}${pad(m)}`,
      `${short}${y}`,
      `${short.toLowerCase()}${y}`,
      `${long}${y}`
    ];
  };

  const preferredKeys = new Set([
    baseName,
    ...buildVariants(now).map(s => `${baseName}_${s}`),
    ...buildVariants(prev).map(s => `${baseName}_${s}`)
  ]);

  const foundValues = [];
  for (const key of preferredKeys) {
    if (process.env[key]) foundValues.push(process.env[key]);
  }

  for (const key of Object.keys(process.env)) {
    if (key === baseName) continue;
    if (key.startsWith(`${baseName}_`) && process.env[key]) {
      const val = process.env[key];
      if (!foundValues.includes(val)) foundValues.push(val);
    }
  }

  return foundValues.length > 0 ? foundValues : undefined;
}

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
    keywords: ['sbmBank'],
    password: process.env.PDF_PASSWORD_BANK_SBM,
    statementType: 'bank_statement',
    useColumnLayout: true
  },
  {
    keywords: ['scapiaCreditCard'],
    password: resolveMonthlyEnv('PDF_PASSWORD_CREDIT_SCAPIA_FEDERAL'), // resolves base or month-suffixed env
    statementType: 'credit_card',
    useColumnLayout: true
  },
  {
    keywords: ['hdfcBank'],
    password: process.env.PDF_PASSWORD_BANK_HDFC,
    statementType: 'bank_statement',
    useColumnLayout: true
  },
].filter(p => p.password); // This ensures we only use configs where a password is set in .env
