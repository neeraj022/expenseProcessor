const OpenAIClient = require('./implementations/openai.client.js');
const GeminiClient = require('./implementations/gemini.client.js');

function getLlmClient() {
  const provider = process.env.LLM_PROVIDER;

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIClient();
    case 'gemini':
      return new GeminiClient();
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

module.exports = { getLlmClient };
