# 🏔️ Avalanche Dev Assistant

An intelligent VS Code extension that provides AI-powered assistance for Avalanche blockchain development using semantic search and large language models.

## ✨ Features

- 🤖 **AI-Powered Q&A**: Get intelligent answers about Avalanche development
- 📚 **Semantic Search**: Search through 534+ Avalanche documentation chunks
- 🎨 **Professional VS Code Integration**: Beautiful webview interface with VS Code theming
- ⚡ **Multiple LLM Support**: OpenAI, Anthropic Claude, and Google Gemini
- 🔍 **Source References**: Links back to original documentation
- 🔄 **Real-time Processing**: Loading states and error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- VS Code
- API key for your chosen LLM provider (OpenAI, Anthropic, or Gemini)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/deepanshu-yd/avalanche-dev-assistant.git
   cd avalanche-dev-assistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your API key
   ```

4. **Start the server:**
   ```bash
   npm run dev:server
   ```

5. **Open the extension in VS Code:**
   ```bash
   cd extension
   code .
   ```

6. **Launch development host:**
   - Press `F5` in VS Code
   - This opens a new Extension Development Host window

7. **Test the extension:**
   - Press `Ctrl+Shift+P`
   - Type "Avalanche: Ask"
   - Enter your question about Avalanche development!

## 🛠 Configuration

### Environment Variables

Copy `server/.env.example` to `server/.env` and configure:

```bash
# Choose your LLM provider
LLM_PROVIDER=gemini  # or openai, anthropic

# Add your API key
GEMINI_API_KEY=your_api_key_here
# OPENAI_API_KEY=your_openai_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here
```

### Supported LLM Providers

- **OpenAI**: GPT-4 and GPT-3.5-turbo models
- **Anthropic**: Claude-3 models
- **Google Gemini**: Gemini-1.5-pro model

## 📁 Project Structure

```
avalanche-dev-assistant/
├── server/                 # RAG Backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── vectorStore.ts    # Document embeddings
│   │   │   ├── embedder.ts       # Text embedding service
│   │   │   └── llmService.ts     # LLM integration
│   │   └── routes.ts             # API endpoints
├── extension/              # VS Code Extension
│   ├── src/
│   │   ├── extension.ts          # Main extension logic
│   │   └── utils/http.ts         # HTTP client
│   └── package.json              # Extension manifest
├── data/                   # Documentation chunks (534 files)
└── scripts/               # Data processing scripts
```

## 🎯 Usage Examples

Try asking questions like:

- "How do I create an Avalanche subnet?"
- "What is a virtual machine in Avalanche?"
- "How do I deploy a smart contract on Avalanche C-Chain?"
- "What are the differences between X-Chain, P-Chain, and C-Chain?"
- "How do I set up an Avalanche validator node?"

## 🔧 Development

### Running Tests
```bash
npm test
```

### Building the Extension
```bash
cd extension
npm run build
```

### Development Server
```bash
npm run dev:server
```

## 📖 Documentation

The system uses Retrieval-Augmented Generation (RAG) to provide accurate, contextual answers:

1. **Question Processing**: User input is converted to embeddings
2. **Semantic Search**: Find relevant documentation chunks
3. **Context Assembly**: Gather the most relevant information
4. **LLM Generation**: Generate answer using selected LLM provider
5. **Response Formatting**: Display with sources and references

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Avalanche Documentation](https://docs.avax.network/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Google Gemini API](https://ai.google.dev/docs)

## ⚡ Performance

- **Document Corpus**: 534 Avalanche documentation chunks
- **Search Latency**: < 100ms for semantic search
- **Response Time**: 2-5 seconds (depending on LLM provider)
- **Embedding Model**: OpenAI text-embedding-ada-002 (with fallback to mock embeddings)

## 🛡️ Security

- API keys are stored in environment variables
- Input sanitization and HTML escaping
- No sensitive data logged
- CORS protection enabled

---

Built with ❤️ for the Avalanche developer community
