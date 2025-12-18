/**
 * James Ultimate - Multi-LLM Provider System
 * Supports OpenAI, Anthropic, Ollama, Azure, Google, and custom providers
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import axios from 'axios';
import { EventEmitter } from 'events';
import { LLMProvider as ILLMProvider, ChatMessage, ChatOptions } from '../types';

interface ProviderConfig {
    name: string;
    models: string[];
    endpoint?: string;
    requiresKey: boolean;
    keyEnvVar?: string;
    apiKey?: string | null;
    chat: (this: ILLMProvider, messages: ChatMessage[], options?: ChatOptions) => Promise<string>;
    listModels?: (this: ILLMProvider) => Promise<string[]>;
}

export class LLMProvider extends EventEmitter {
    private providers: Map<string, ILLMProvider>;
    public activeProvider: ILLMProvider | null = null;
    public activeModel: string | null = null;
    
    constructor(_config: Record<string, any> = {}) {
        super();
        this.providers = new Map();
        
        this.initializeProviders();
    }
    
    private initializeProviders(): void {
        // OpenAI Provider
        this.registerProvider('openai', {
            name: 'OpenAI',
            models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
            endpoint: 'https://api.openai.com/v1/chat/completions',
            requiresKey: true,
            keyEnvVar: 'OPENAI_API_KEY',
            async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
                const response = await axios.post(this.endpoint!, {
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
            async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
                const systemMessage = messages.find(m => m.role === 'system');
                const otherMessages = messages.filter(m => m.role !== 'system');
                
                const response = await axios.post(this.endpoint!, {
                    model: options.model || 'claude-3-opus-20240229',
                    max_tokens: options.maxTokens || 4096,
                    system: systemMessage?.content || '',
                    messages: otherMessages.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.content
                    }))
                }, {
                    headers: {
                        'x-api-key': this.apiKey!,
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
            models: ['llama2', 'llama3', 'mistral', 'mixtral', 'codellama', 'phi', 'deepseek-coder'],
            endpoint: 'http://localhost:11434/api/chat',
            requiresKey: false,
            async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
                const response = await axios.post(this.endpoint!, {
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
            async listModels(): Promise<string[]> {
                try {
                    const response = await axios.get('http://localhost:11434/api/tags');
                    return response.data.models.map((m: any) => m.name);
                } catch (e) {
                    return this.models;
                }
            }
        });
        
        // KoboldAI Provider (Local)
        this.registerProvider('koboldai', {
            name: 'KoboldAI (Local)',
            models: ['koboldai-local', 'pygmalion', 'llama', 'gpt4all', 'vicuna', 'alpaca'],
            endpoint: 'http://localhost:5001/api/v1/generate',
            requiresKey: false,
            async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
                // KoboldAI uses a different format - combine messages into prompt
                const prompt = messages
                    .map(m => {
                        if (m.role === 'system') return `System: ${m.content}\n`;
                        if (m.role === 'user') return `User: ${m.content}\n`;
                        if (m.role === 'assistant') return `Assistant: ${m.content}\n`;
                        return '';
                    })
                    .join('') + 'Assistant:';
                
                const response = await axios.post(this.endpoint!, {
                    prompt: prompt,
                    max_length: options.maxTokens || 300,
                    max_context_length: 2048,
                    temperature: options.temperature || 0.7,
                    top_p: 0.9,
                    top_k: 40,
                    rep_pen: 1.1,
                    stop_sequence: ['User:', 'System:'],
                    use_story: false,
                    use_memory: false,
                    use_authors_note: false,
                    use_world_info: false
                });
                
                return response.data.results[0].text.trim();
            },
            async listModels(): Promise<string[]> {
                try {
                    const response = await axios.get('http://localhost:5001/api/v1/model');
                    return [response.data.result];
                } catch (e) {
                    return this.models;
                }
            }
        });
        
        // Groq Provider
        this.registerProvider('groq', {
            name: 'Groq',
            models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            requiresKey: true,
            keyEnvVar: 'GROQ_API_KEY',
            async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
                const response = await axios.post(this.endpoint!, {
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
    }
    
    private registerProvider(id: string, config: ProviderConfig): void {
        this.providers.set(id, {
            id,
            ...config,
            apiKey: config.keyEnvVar ? (process.env[config.keyEnvVar] || null) : null
        });
    }
    
    getProviders(): Array<{id: string; name: string; models: string[]; requiresKey: boolean; hasKey: boolean; isLocal: boolean}> {
        return Array.from(this.providers.values()).map(p => ({
            id: p.id,
            name: p.name,
            models: p.models,
            requiresKey: p.requiresKey,
            hasKey: !!p.apiKey,
            isLocal: !p.requiresKey
        }));
    }
    
    getProvider(id: string): ILLMProvider | undefined {
        return this.providers.get(id);
    }
    
    setActiveProvider(providerId: string, model: string | null = null): {provider: string; model: string} {
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
    
    setApiKey(providerId: string, apiKey: string): void {
        const provider = this.providers.get(providerId);
        if (provider) {
            provider.apiKey = apiKey;
            this.emit('apiKeySet', { provider: providerId });
        }
    }
    
    async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
        const provider = options.provider 
            ? this.providers.get(options.provider) 
            : this.activeProvider;
        
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
    
    async testProvider(providerId: string): Promise<{success: boolean; response?: string; error?: string}> {
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
            return { success: false, error: (error as Error).message };
        }
    }
    
    async listOllamaModels(): Promise<Array<{name: string; size: number; modified: string}>> {
        try {
            const response = await axios.get('http://localhost:11434/api/tags');
            return response.data.models.map((m: any) => ({
                name: m.name,
                size: m.size,
                modified: m.modified_at
            }));
        } catch (error) {
            return [];
        }
    }
}

// Singleton instance
export const llmProvider = new LLMProvider();