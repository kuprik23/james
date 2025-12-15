/**
 * James Ultimate - Multi-LLM Provider System
 * Supports OpenAI, Anthropic, Ollama, Azure, Google, and custom providers
 */

const axios = require('axios');
const EventEmitter = require('events');

class LLMProvider extends EventEmitter {
  constructor(config = {}) {
    super();
    this.providers = new Map();
    this.activeProvider = null;
    this.activeModel = null;
    this.config = config;
    
    // Initialize default providers
    this.initializeProviders();
  }

  initializeProviders() {
    // OpenAI Provider
    this.registerProvider('openai', {
      name: 'OpenAI',
      models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
      endpoint: 'https://api.openai.com/v1/chat/completions',
      requiresKey: true,
      keyEnvVar: 'OPENAI_API_KEY',
      async chat(messages, options = {}) {
        const response = await axios.post(this.endpoint, {
          model: options.model || 'gpt-4-turbo-preview',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
          stream: options.stream || false
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data.choices[0].message.content;
      }
    });

    // Anthropic Provider
    this.registerProvider('anthropic', {
      name: 'Anthropic',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
      endpoint: 'https://api.anthropic.com/v1/messages',
      requiresKey: true,
      keyEnvVar: 'ANTHROPIC_API_KEY',
      async chat(messages, options = {}) {
        // Convert messages to Anthropic format
        const systemMessage = messages.find(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system');
        
        const response = await axios.post(this.endpoint, {
          model: options.model || 'claude-3-opus-20240229',
          max_tokens: options.maxTokens || 4096,
          system: systemMessage?.content || '',
          messages: otherMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        }, {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        });
        return response.data.content[0].text;
      }
    });

    // Ollama Provider (Local)
    this.registerProvider('ollama', {
      name: 'Ollama (Local)',
      models: ['llama2', 'llama3', 'mistral', 'mixtral', 'codellama', 'phi', 'neural-chat', 'starling-lm', 'vicuna', 'orca-mini', 'deepseek-coder'],
      endpoint: 'http://localhost:11434/api/chat',
      requiresKey: false,
      async chat(messages, options = {}) {
        const response = await axios.post(this.endpoint, {
          model: options.model || 'llama2',
          messages: messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 4096
          }
        });
        return response.data.message.content;
      },
      async listModels() {
        try {
          const response = await axios.get('http://localhost:11434/api/tags');
          return response.data.models.map(m => m.name);
        } catch (e) {
          return this.models;
        }
      }
    });

    // Azure OpenAI Provider
    this.registerProvider('azure', {
      name: 'Azure OpenAI',
      models: ['gpt-4', 'gpt-35-turbo'],
      requiresKey: true,
      keyEnvVar: 'AZURE_OPENAI_API_KEY',
      async chat(messages, options = {}) {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const deployment = options.model || process.env.AZURE_OPENAI_DEPLOYMENT;
        
        const response = await axios.post(
          `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
          {
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096
          },
          {
            headers: {
              'api-key': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        return response.data.choices[0].message.content;
      }
    });

    // Google Gemini Provider
    this.registerProvider('google', {
      name: 'Google Gemini',
      models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      requiresKey: true,
      keyEnvVar: 'GOOGLE_API_KEY',
      async chat(messages, options = {}) {
        const model = options.model || 'gemini-pro';
        const response = await axios.post(
          `${this.endpoint}/${model}:generateContent?key=${this.apiKey}`,
          {
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              temperature: options.temperature || 0.7,
              maxOutputTokens: options.maxTokens || 4096
            }
          }
        );
        return response.data.candidates[0].content.parts[0].text;
      }
    });

    // Groq Provider (Fast inference)
    this.registerProvider('groq', {
      name: 'Groq',
      models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma-7b-it'],
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      requiresKey: true,
      keyEnvVar: 'GROQ_API_KEY',
      async chat(messages, options = {}) {
        const response = await axios.post(this.endpoint, {
          model: options.model || 'llama-3.1-70b-versatile',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data.choices[0].message.content;
      }
    });

    // Together AI Provider
    this.registerProvider('together', {
      name: 'Together AI',
      models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'togethercomputer/CodeLlama-34b-Instruct'],
      endpoint: 'https://api.together.xyz/v1/chat/completions',
      requiresKey: true,
      keyEnvVar: 'TOGETHER_API_KEY',
      async chat(messages, options = {}) {
        const response = await axios.post(this.endpoint, {
          model: options.model || 'meta-llama/Llama-3-70b-chat-hf',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        return response.data.choices[0].message.content;
      }
    });

    // OpenRouter Provider (Access to many models)
    this.registerProvider('openrouter', {
      name: 'OpenRouter',
      models: ['openai/gpt-4-turbo', 'anthropic/claude-3-opus', 'google/gemini-pro', 'meta-llama/llama-3-70b-instruct'],
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      requiresKey: true,
      keyEnvVar: 'OPENROUTER_API_KEY',
      async chat(messages, options = {}) {
        const response = await axios.post(this.endpoint, {
          model: options.model || 'openai/gpt-4-turbo',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://james-security.local',
            'X-Title': 'James Security Agent'
          }
        });
        return response.data.choices[0].message.content;
      }
    });

    // LM Studio Provider (Local)
    this.registerProvider('lmstudio', {
      name: 'LM Studio (Local)',
      models: ['local-model'],
      endpoint: 'http://localhost:1234/v1/chat/completions',
      requiresKey: false,
      async chat(messages, options = {}) {
        const response = await axios.post(this.endpoint, {
          model: options.model || 'local-model',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096
        });
        return response.data.choices[0].message.content;
      }
    });
  }

  registerProvider(id, config) {
    this.providers.set(id, {
      id,
      ...config,
      apiKey: process.env[config.keyEnvVar] || null
    });
  }

  registerCustomProvider(id, config) {
    this.providers.set(id, {
      id,
      name: config.name || id,
      models: config.models || [],
      endpoint: config.endpoint,
      requiresKey: config.requiresKey || false,
      apiKey: config.apiKey || null,
      async chat(messages, options = {}) {
        // Custom chat implementation
        const response = await axios.post(config.endpoint, {
          model: options.model || config.models[0],
          messages: messages,
          ...config.requestBody
        }, {
          headers: {
            ...config.headers,
            'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined
          }
        });
        
        // Extract response based on config
        if (config.responseParser) {
          return config.responseParser(response.data);
        }
        return response.data.choices?.[0]?.message?.content || response.data.response || response.data.text;
      }
    });
  }

  getProviders() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      models: p.models,
      requiresKey: p.requiresKey,
      hasKey: !!p.apiKey,
      isLocal: !p.requiresKey
    }));
  }

  getProvider(id) {
    return this.providers.get(id);
  }

  setActiveProvider(providerId, model = null) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }
    
    this.activeProvider = provider;
    this.activeModel = model || provider.models[0];
    
    this.emit('providerChanged', {
      provider: providerId,
      model: this.activeModel
    });
    
    return { provider: providerId, model: this.activeModel };
  }

  setApiKey(providerId, apiKey) {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.apiKey = apiKey;
      this.emit('apiKeySet', { provider: providerId });
    }
  }

  async chat(messages, options = {}) {
    const provider = options.provider ? this.providers.get(options.provider) : this.activeProvider;
    
    if (!provider) {
      throw new Error('No active provider. Call setActiveProvider() first.');
    }
    
    if (provider.requiresKey && !provider.apiKey) {
      throw new Error(`API key required for ${provider.name}. Set ${provider.keyEnvVar} or call setApiKey().`);
    }
    
    const model = options.model || this.activeModel || provider.models[0];
    
    this.emit('chatStart', { provider: provider.id, model });
    
    try {
      const response = await provider.chat.call(provider, messages, { ...options, model });
      this.emit('chatComplete', { provider: provider.id, model, response });
      return response;
    } catch (error) {
      this.emit('chatError', { provider: provider.id, model, error });
      throw error;
    }
  }

  async testProvider(providerId) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }
    
    try {
      const response = await provider.chat.call(provider, [
        { role: 'user', content: 'Say "Hello" and nothing else.' }
      ], { maxTokens: 10 });
      
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listOllamaModels() {
    try {
      const response = await axios.get('http://localhost:11434/api/tags');
      return response.data.models.map(m => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at
      }));
    } catch (error) {
      return [];
    }
  }

  async pullOllamaModel(modelName) {
    try {
      const response = await axios.post('http://localhost:11434/api/pull', {
        name: modelName,
        stream: false
      });
      return { success: true, status: response.data.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const llmProvider = new LLMProvider();

module.exports = { LLMProvider, llmProvider };