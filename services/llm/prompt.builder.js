function buildExtractionPrompt(text, categories) {
  const validCategories = categories.join(', ');
  return `
        Analyze the following financial statement text and extract all expense and income transactions.
        This includes regular purchases, refunds, income deposits, and payments made to credit cards.
        Format the output as a JSON object. The JSON object should have a single key, "expenses", which contains an array of objects. Each object should have these exact keys: "date", "description", "amount", "type" (either "debit" or "credit"), "category", and "isPayment" (a boolean).
        The "date" must be in "MM-DD-YYYY" format. Date formats like "DD-MM-YYYY" or "YYYY-MM-DD" are not acceptable.
        The "category" MUST be one of the following values: [${validCategories}].
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
        Set "isPayment" to true if the transaction is for a credit card bill payment (descriptions might include 'Payment Received, Thank You', 'payment towards card', 'credit card payment', 'Autodebit Payment Recd'), and false for all other transactions like purchases, income, or refunds.
        On bank statements, credits are often income. Income descriptions may include 'RDA Vostro FIR NIUM PTE L', 'dividend', 'Uengage', or 'INDOFAST SWAP EN'.
        On credit card statements, credits can be payments or refunds. Extract both, but correctly identify payments with the "isPayment" flag.
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
