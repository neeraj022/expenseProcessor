const OpenAIClient = require('./implementations/openai.client.js');
const GeminiClient = require('./implementations/gemini.client.js');
const ClaudeClient = require('./implementations/claude.client.js');

function getLlmClient() {
  const providerRaw = process.env.LLM_PROVIDER;
  if (!providerRaw) {
    throw new Error("LLM_PROVIDER is not set. Set LLM_PROVIDER to 'openai', 'gemini', or 'claude'.");
  }

  const provider = providerRaw.toLowerCase();

  switch (provider) {
    case 'openai':
      return new OpenAIClient();
    case 'gemini':
      return new GeminiClient();
    case 'claude':
      return new ClaudeClient();
    default:
      throw new Error(`Unsupported LLM provider: ${providerRaw}`);
  }
}

module.exports = { getLlmClient };
