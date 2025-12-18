# KoboldAI Integration Guide

## Overview

James Ultimate now includes full support for **KoboldAI**, a local AI inference engine that's perfect for:
- Privacy-focused AI deployments
- Offline operation
- Custom model training
- Community-driven models
- No API costs

## What is KoboldAI?

KoboldAI is a browser-based front-end for AI-assisted writing with multiple local & remote AI models. It provides:
- Local model hosting (no cloud dependency)
- Support for various model formats (GGML, GGUF, PyTorch)
- Web UI for model management
- API compatibility with multiple formats
- Fine-tuning capabilities

## Installation

### Option 1: KoboldAI Standalone
1. Download from: https://github.com/KoboldAI/KoboldAI-Client/releases
2. Extract to your preferred location
3. Run `play.bat` (Windows) or `play.sh` (Linux/Mac)
4. Select a model to load
5. Access at http://localhost:5001

### Option 2: KoboldCpp (Faster, Recommended)
1. Download from: https://github.com/LostRuins/koboldcpp/releases
2. Run `koboldcpp.exe`
3. Select your GGUF model file
4. Configure settings and click Launch
5. Access at http://localhost:5001

### Option 3: Docker
```bash
docker run -d \
  -p 5001:5001 \
  -v /path/to/models:/models \
  --name koboldai \
  ghcr.io/koboldai/koboldai-client:latest
```

## Recommended Models

### For Security Analysis (High Accuracy)
- **CodeLlama 13B** - Excellent for code analysis
- **Mistral 7B** - Fast and accurate
- **Llama 2 13B** - Good balance of speed/quality
- **Nous Hermes 2** - Strong reasoning

### For General Assistance
- **Vicuna 13B** - Conversational
- **Alpaca 13B** - Instruction following
- **GPT4All-J** - Lightweight, fast

### For Creative Tasks
- **Pygmalion** - Character-focused
- **MythoMax** - Creative writing

## Configuration

### In James Ultimate

1. **Start KoboldAI** with your preferred model

2. **Switch to KoboldAI in James:**
```
/llm switch koboldai
```

3. **Verify connection:**
```
/llm test
```

4. **Check available model:**
```
/llm models
```

### Environment Variables (Optional)

```bash
# .env file
KOBOLDAI_URL=http://localhost:5001
KOBOLDAI_DEFAULT_MODEL=koboldai-local
```

## Usage Examples

### Basic Chat
```typescript
import { llmProvider } from './src/llm/provider';

// Set KoboldAI as active provider
llmProvider.setActiveProvider('koboldai');

// Chat
const response = await llmProvider.chat([
    { role: 'user', content: 'Analyze this code for vulnerabilities...' }
]);
```

### With Security Agents
```typescript
import { agentManager } from './src/agents/agent-manager';

// Switch to security analyst agent
agentManager.setActiveAgent('security-analyst');

// Switch LLM to KoboldAI
llmProvider.setActiveProvider('koboldai');

// Use agent with KoboldAI
const result = await agentManager.chat('Scan this network for vulnerabilities');
```

### Custom Parameters
```typescript
const response = await llmProvider.chat(messages, {
    provider: 'koboldai',
    temperature: 0.7,
    maxTokens: 500,
    model: 'koboldai-local'
});
```

## API Endpoints

KoboldAI exposes several useful endpoints:

### Generate Text
```http
POST http://localhost:5001/api/v1/generate
Content-Type: application/json

{
    "prompt": "Your prompt here",
    "max_length": 300,
    "temperature": 0.7
}
```

### Get Model Info
```http
GET http://localhost:5001/api/v1/model
```

### Get Config
```http
GET http://localhost:5001/api/v1/config/soft_prompts_list
```

## Integration Features

### Automatic Prompt Formatting
James automatically formats conversations for KoboldAI:
```
System: You are a security expert...
User: What are common SQL injection patterns?
Assistant: SQL injection patterns include...
User: How do I prevent them?
Assistant:
```

### Stop Sequences
Configured to stop at:
- `User:`
- `System:`

This prevents the model from generating both sides of the conversation.

### Context Management
- Automatic context length management
- History truncation when needed
- System prompt integration

## Performance Optimization

### For Best Results:

1. **Hardware Recommendations:**
   - 16GB+ RAM for 7B models
   - 32GB+ RAM for 13B models
   - 64GB+ RAM for 30B+ models
   - GPU: NVIDIA with CUDA (optional but faster)

2. **KoboldCpp Settings:**
   - Use `--threads` to set CPU cores
   - Enable `--usecublas` for NVIDIA GPU acceleration
   - Set `--contextsize` appropriately (2048-4096)

3. **Model Quantization:**
   - Use Q4_K_M quantization for best speed/quality balance
   - Q5_K_M for slightly better quality
   - Q8_0 for maximum quality (slower)

### Example KoboldCpp Launch:
```cmd
koboldcpp.exe --model mistral-7b-instruct-v0.2.Q4_K_M.gguf --threads 8 --usecublas --contextsize 4096 --port 5001
```

## Troubleshooting

### Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5001
```
**Solution:** Ensure KoboldAI is running on port 5001

### Model Not Loaded
**Solution:** Load a model in KoboldAI web UI first

### Slow Responses
**Solutions:**
- Use smaller model (7B instead of 13B)
- Enable GPU acceleration
- Use quantized models (Q4_K_M)
- Reduce context size
- Increase CPU threads

### Gibberish Output
**Solutions:**
- Adjust temperature (try 0.5-0.8)
- Check model compatibility
- Verify prompt format
- Try different model

## Comparison with Other Providers

| Feature | KoboldAI | Ollama | OpenAI | Anthropic |
|---------|----------|--------|--------|-----------|
| **Cost** | Free | Free | Paid | Paid |
| **Privacy** | ✅ Local | ✅ Local | ❌ Cloud | ❌ Cloud |
| **Speed** | Medium | Fast | Very Fast | Very Fast |
| **Quality** | Good | Good | Excellent | Excellent |
| **Offline** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Custom Models** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Fine-tuning** | ✅ Yes | Limited | ❌ No | ❌ No |

## Advanced Features

### Custom System Prompts
```typescript
const customAgent = agentManager.createCustomAgent('kobold-security', {
    name: 'KoboldAI Security Expert',
    systemPrompt: `You are an expert cybersecurity analyst running on KoboldAI.
    Focus on practical, actionable security advice.
    Always consider privacy and offline operation capabilities.`,
    temperature: 0.6
});
```

### Model-Specific Optimization
```typescript
// For CodeLlama models
llmProvider.chat(messages, {
    provider: 'koboldai',
    temperature: 0.3, // Lower for code
    maxTokens: 1000
});

// For creative tasks
llmProvider.chat(messages, {
    provider: 'koboldai',
    temperature: 0.9, // Higher for creativity
    maxTokens: 500
});
```

### Batch Processing
```typescript
const tasks = [
    'Analyze this SQL query for injection risks',
    'Review this API endpoint for security issues',
    'Check this config for best practices'
];

for (const task of tasks) {
    const result = await llmProvider.chat([
        { role: 'user', content: task }
    ], { provider: 'koboldai' });
    console.log(result);
}
```

## Use Cases

### Security Analysis
- Code vulnerability scanning
- Log analysis
- Threat intelligence
- Incident response guidance

### Privacy-Focused Operations
- Analyzing sensitive code
- Processing confidential data
- Offline security assessments
- Air-gapped environments

### Custom Model Training
- Train on your codebase
- Fine-tune for your environment
- Domain-specific security knowledge
- Custom vulnerability patterns

## Best Practices

1. **Model Selection**
   - Use CodeLlama for code analysis
   - Use Mistral for general security
   - Use larger models for complex analysis

2. **Prompt Engineering**
   - Be specific in requests
   - Provide context and examples
   - Use structured prompts
   - Include relevant background

3. **Resource Management**
   - Monitor RAM usage
   - Use appropriate context sizes
   - Close unused models
   - Restart periodically

4. **Quality Control**
   - Verify AI suggestions manually
   - Cross-reference with multiple sources
   - Test recommendations thoroughly
   - Document AI-assisted decisions

## Integration Checklist

- [ ] KoboldAI/KoboldCpp installed
- [ ] Model downloaded and loaded
- [ ] Server running on port 5001
- [ ] Tested connection from James
- [ ] Switched to KoboldAI provider
- [ ] Verified responses with test prompts
- [ ] Configured optimal settings
- [ ] Set up preferred agents

## Resources

- **KoboldAI GitHub:** https://github.com/KoboldAI/KoboldAI-Client
- **KoboldCpp GitHub:** https://github.com/LostRuins/koboldcpp
- **Model Hub:** https://huggingface.co/models
- **GGUF Models:** https://huggingface.co/models?library=gguf
- **Community:** https://discord.gg/koboldai

## Support

For issues with:
- **James integration:** Check this documentation
- **KoboldAI setup:** Visit KoboldAI GitHub issues
- **Model loading:** Check KoboldAI Discord community
- **Performance:** Review hardware requirements

---

**Pro Tip:** For best security analysis results, use CodeLlama 13B or Mistral 7B Instruct with temperature 0.3-0.5 for more consistent, accurate responses.