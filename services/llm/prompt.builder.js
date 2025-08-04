function buildExtractionPrompt(text, categories) {
  const validCategories = categories.join(', ');
  return `
        Analyze the following financial statement text and extract all expense and income transactions.
        This includes regular purchases, refunds, income deposits, and payments made to credit cards.
        Format the output as a JSON object. The JSON object should have a single key, "expenses", which contains an array of objects. Each object should have these exact keys: "date", "description", "amount", "type" (either "debit" or "credit"), "category", and "isPayment" (a boolean).
        The "date" must be in "MM/DD/YYYY" format.
        The "category" MUST be one of the following values: [${validCategories}].
        "debit" represents money spent or transferred out. "credit" represents money received or returned.
        Set "isPayment" to true if the transaction is for a credit card bill payment (descriptions might include 'Payment Received, Thank You', 'payment towards card', 'credit card payment'), and false for all other transactions like purchases, income, or refunds.
        On bank statements, credits are often income. Income descriptions may include 'RDA Vostro FIR NIUM PTE L', 'dividend', 'Uengage', or 'INDOFAST SWAP EN'.
        On credit card statements, credits can be payments or refunds. Extract both, but correctly identify payments with the "isPayment" flag.
        If a value is not present, use null.
        Sometimes the reward point column is also present next to the amount column, but it should not be considered in the output.
        Amount can't be larger than 1000000.
        Text:
        ---
        ${text}
        ---
      `;
}

module.exports = { buildExtractionPrompt };
