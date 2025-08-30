function buildExtractionPrompt(text, expenseCategories, incomeCategories) {
  const validExpenseCategories = expenseCategories.join(', ');
  const validIncomeCategories = incomeCategories.join(', ');
  return `
        Analyze the following financial statement text and extract all expense and income transactions.
        This includes regular purchases, refunds, income deposits, and payments made to credit cards.
        Format the output as a JSON object. The JSON object should have a single key, "expenses", which contains an array of objects. Each object should have these exact keys: "date", "description", "amount", "type" (either "debit" or "credit"), "category", and "isPayment" (a boolean).
        
        The "date" must be in "MM-DD-YYYY" format. Date formats like "DD-MM-YYYY" or "YYYY-MM-DD" are not acceptable.
        
        For "debit" transactions (money spent), the "category" MUST be one of the following values: [${validExpenseCategories}].
        For "credit" transactions that are income (money received, not refunds), the "category" MUST be one of the following values: [${validIncomeCategories}].
        For "credit" transactions that are refunds for a previous purchase, the "category" MUST be the same expense category as the original purchase from [${validExpenseCategories}].
        For "credit" transactions on a credit card statement that are payments to the card, set the category to "Credit Card Payment".
        
        Here are some categorization hints. These are just guidelines; use your best judgment for other descriptions.
        - Grocery: swiggy instamart, zepto, grofers, AMAZON.IN - GROCER, Bundl Technologies, LULU VALUE MART, ROLLA HYPER MARKET, Avenue Supermarts, MAX HYPERMARKET, VILLAGE HYPERMARKET, UPI to sujatha param
        - Mobile-internet: RELIANCE JIO INFOCOMM
        - Food-order: Swiggy Limited IN, BUNDL TECHNOLOGIES
        - Holidays: Makemytrip India Pvt, IBIBO GROUP PVT
        - Insurance: MAX LIFE INSURANCE
        - Travel: Bangalore Metro Rail
        - Electricity-gas: GAIL Gas
        - Services: cleaning, cooking, hair cut, urban clap, SALON, Ajimul, BEEGLE, ROJINA, Astrotalk etc
        - Childcare: School, skating, kids, toy, first cry, ITSY BITSY, SAPNA, HAMLEYS, SAMKAN, TYNIMO, KYDO LAND, LITTLE BOSS, MINISO, FUNCITY
        - Taxi: Uber, Ola, Rapid, Namma Yatra etc
        - Petrol: Fuel
        - Subscriptions: NETFLIX, GOOGLE WORKSPACE, apple services
        - Self-care: LENSKART
        - Entertainment: IDC KITCHEN, MC DONALDS, STERLINGS MAC FAST, EAZYDINER, CHAI POINT, KAKAL KAI RUCHI
        - Clothing: SHOPPERS STOP, Myntra, Ajio, LIFE STYLE, KUBERAN, ZUDIO, WESTSIDE, ADITYA BIRLA FASHION, MADURA GARMENTS, FEET FASHION, TEMPLE FABRICS, BHARTIYA JALPAN, KUSHALS RETAIL, pantaloons, Trent

        "debit" represents money spent or transferred out. "credit" represents money received or returned.
        The transactions are usually listed chronologically. Bank statements often include a running balance after each transaction. Use this to determine if a transaction is a 'debit' or 'credit'. A 'debit' will decrease the running balance, and a 'credit' will increase it. Even if the text formatting from the PDF is messy and columns are not clearly separated, you can infer the transaction type by observing how the numbers in a row affect what appears to be a running balance.
        
        Set "isPayment" to true if the transaction is for a credit card bill payment (descriptions might include 'Payment Received, Thank You', 'payment towards card', 'credit card payment', 'Autodebit Payment Recd'), and false for all other transactions like purchases, income, or refunds.
        
        On bank statements, credits are often income. Income descriptions may include 'RDA Vostro FIR NIUM PTE L', 'dividend', 'Uengage', or 'INDOFAST SWAP EN'. All income transactions must be categorized using one of the valid income categories.
        Pay special attention to dividend transactions on bank statements. They are 'credit' transactions, usually for very small amounts, and the description is often followed by a long serial number. When extracting the description for a dividend, do not include this trailing serial number.
        
        On credit card statements, credits can be payments or refunds. Extract both, but correctly identify payments with the "isPayment" flag. Refunds on credit cards should be categorized under an appropriate expense category, not an income category.
        
        If a value is not present, use null.
        Sometimes the reward point column is also present next to the amount column, but it should not be considered in the output.
        Amounts are always in 2 decimal format, e.g., 123.45.
        Amount can't be larger than 1000000.
        
        Text:
        ---
        ${text}
        ---
      `;
}

module.exports = { buildExtractionPrompt };
