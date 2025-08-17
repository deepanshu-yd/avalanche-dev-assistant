// Part 4 Test: LLM Integration with Semantic Search
// Tests the complete RAG pipeline without requiring actual API keys

const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

console.log('🧪 Testing Part 4 - LLM + Semantic Search Integration');

// Mock LLM Service
class MockLLMService {
  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'openai';
  }

  async generateAnswer(query, searchResults) {
    // Check if no relevant docs found
    if (!searchResults.length) {
      return {
        answer: "No relevant documentation found. Please refine your question or try asking about Avalanche smart contracts, subnets, or development tools.",
        provider: this.provider
      };
    }

    // Build context from search results (top 3 chunks)
    const context = searchResults
      .slice(0, 3)
      .map((result, index) =>
        `[Document ${index + 1}${result.chunk.section ? ` - ${result.chunk.section}` : ''}]:\n${result.chunk.text.substring(0, 200)}...`
      )
      .join('\n\n---\n\n');

    // Mock LLM response based on query patterns
    let mockAnswer = "";
    const queryLower = query.toLowerCase();

    if (queryLower.includes('smart contract') || queryLower.includes('deploy')) {
      mockAnswer = `To deploy smart contracts on Avalanche:

1. **Setup Environment**: Install Hardhat and configure for Avalanche networks
2. **Network Configuration**: Add Avalanche mainnet and Fuji testnet to your config
3. **Deploy Process**: Use \`npx hardhat run scripts/deploy.js --network fuji\` for testnet

Avalanche C-Chain is fully EVM-compatible, so existing Ethereum contracts work seamlessly. Always test on Fuji testnet first before mainnet deployment.

*Based on ${searchResults.length} documentation sources.*`;
    } else if (queryLower.includes('subnet')) {
      mockAnswer = `Avalanche Subnets allow you to create custom blockchain networks:

1. **What are Subnets**: Sovereign networks with custom rules for membership, token economics, and validators
2. **Benefits**: Dedicated resources, no gas competition, compliance features
3. **Creation**: Use \`avalanche subnet create\` command with Avalanche-CLI

Subnets can use existing VMs (like Subnet-EVM) or custom virtual machines for specialized applications.

*Based on ${searchResults.length} documentation sources.*`;
    } else if (queryLower.includes('avalanche') || queryLower.includes('blockchain')) {
      mockAnswer = `Avalanche is a high-performance blockchain platform featuring:

1. **Architecture**: Primary Network with X-Chain, P-Chain, and C-Chain
2. **Consensus**: Snow consensus for sub-second finality and high throughput
3. **Development**: EVM-compatible C-Chain for smart contracts

Key advantages include eco-friendly consensus, customizable subnets, and interoperability with other blockchains.

*Based on ${searchResults.length} documentation sources.*`;
    } else {
      mockAnswer = `Based on the available Avalanche documentation, here's what I found:

${context}

This information should help with your question about "${query}". For more specific guidance, try asking about smart contracts, subnets, or development tools.

*Generated from ${searchResults.length} relevant documentation chunks.*`;
    }

    return {
      answer: mockAnswer,
      tokensUsed: Math.floor(Math.random() * 500) + 200, // Mock token usage
      provider: this.provider
    };
  }
}

// Mock Vector Store (reuse from Part 3)
class MockVectorStore {
  constructor() {
    this.chunks = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('🔄 Loading chunks for Part 4 test...');

    const chunksPath = '../data/chunks/chunks.jsonl';
    const chunksData = fs.readFileSync(chunksPath, 'utf-8');

    this.chunks = chunksData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .slice(0, 50); // Limit for testing

    // Mock embeddings
    this.chunks.forEach((chunk, i) => {
      chunk.mockEmbedding = this.generateMockEmbedding(chunk.text, i);
    });

    this.initialized = true;
    console.log(`✅ Loaded ${this.chunks.length} chunks with mock embeddings`);
  }

  generateMockEmbedding(text, index) {
    // Simple mock embedding based on text features
    const textLower = text.toLowerCase();
    return {
      hasAvalanche: textLower.includes('avalanche') ? 1 : 0,
      hasContract: textLower.includes('contract') ? 1 : 0,
      hasSubnet: textLower.includes('subnet') ? 1 : 0,
      hasDeploy: textLower.includes('deploy') ? 1 : 0,
      index: index / 100 // Simple position-based feature
    };
  }

  async searchDocs(query, topK = 5) {
    if (!this.initialized) await this.initialize();

    const queryLower = query.toLowerCase();
    const results = this.chunks
      .map(chunk => {
        // Simple relevance scoring
        let score = 0;
        const textLower = chunk.text.toLowerCase();

        // Exact phrase matching
        if (textLower.includes(queryLower)) score += 10;

        // Keyword matching
        queryLower.split(' ').forEach(word => {
          if (textLower.includes(word)) score += 1;
        });

        // Feature-based scoring
        if (queryLower.includes('contract') && chunk.mockEmbedding.hasContract) score += 5;
        if (queryLower.includes('subnet') && chunk.mockEmbedding.hasSubnet) score += 5;
        if (queryLower.includes('avalanche') && chunk.mockEmbedding.hasAvalanche) score += 3;

        return {
          chunk,
          similarity: Math.min(score / 20, 1) // Normalize to 0-1 range
        };
      })
      .filter(result => result.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }
}

const mockVectorStore = new MockVectorStore();
const mockLLMService = new MockLLMService();

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Part 4 RAG Pipeline Test Server',
    provider: mockLLMService.provider
  });
});

// Full RAG pipeline endpoint
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    console.log(`🔍 Processing RAG query: "${question}"`);

    // Step 1: Semantic search
    const searchResults = await mockVectorStore.searchDocs(question, 5);
    console.log(`📊 Found ${searchResults.length} relevant chunks`);

    // Step 2: LLM generation
    const llmResponse = await mockLLMService.generateAnswer(question, searchResults);
    console.log(`🤖 Generated ${llmResponse.provider} response (${llmResponse.tokensUsed} tokens)`);

    // Step 3: Format response
    const sources = searchResults.map(result => ({
      url: result.chunk.url,
      title: result.chunk.title || 'Avalanche Documentation',
      section: result.chunk.section,
      similarity: Math.round(result.similarity * 1000) / 1000
    }));

    const context = searchResults.map(result => ({
      text: result.chunk.text.substring(0, 300) + '...',
      metadata: {
        id: result.chunk.id,
        url: result.chunk.url,
        title: result.chunk.title || 'Avalanche Documentation',
        section: result.chunk.section,
        tokens: result.chunk.tokens,
        similarity: Math.round(result.similarity * 1000) / 1000
      }
    }));

    const response = {
      answer: llmResponse.answer,
      sources,
      context,
      provider: llmResponse.provider,
      tokensUsed: llmResponse.tokensUsed
    };

    console.log(`✅ RAG pipeline complete: ${sources.length} sources, ${context.length} context chunks`);

    res.json(response);
  } catch (error) {
    console.error('❌ Error in RAG pipeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test queries endpoint
app.get('/test-queries', async (req, res) => {
  const testQueries = [
    'How do I deploy a smart contract on Avalanche?',
    'What are Avalanche subnets?',
    'How does Avalanche consensus work?',
    'What is the C-Chain in Avalanche?'
  ];

  const results = [];

  for (const query of testQueries) {
    try {
      const searchResults = await mockVectorStore.searchDocs(query, 3);
      const llmResponse = await mockLLMService.generateAnswer(query, searchResults);

      results.push({
        query,
        foundChunks: searchResults.length,
        avgSimilarity: searchResults.length > 0
          ? searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length
          : 0,
        answerLength: llmResponse.answer.length,
        provider: llmResponse.provider
      });
    } catch (error) {
      results.push({
        query,
        error: error.message
      });
    }
  }

  res.json({
    message: 'Part 4 RAG Pipeline Test Results',
    results,
    summary: {
      totalQueries: testQueries.length,
      successful: results.filter(r => !r.error).length,
      avgChunksFound: results.reduce((sum, r) => sum + (r.foundChunks || 0), 0) / testQueries.length
    }
  });
});

const PORT = 3002;

app.listen(PORT, async () => {
  console.log(`🚀 Part 4 RAG Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /ask - Full RAG pipeline`);
  console.log(`   GET  /test-queries - Run test queries`);
  console.log(`\n💡 Test commands:`);
  console.log(`   curl -X POST http://localhost:${PORT}/ask -H "Content-Type: application/json" -d '{"question": "How do I deploy smart contracts?"}'`);
  console.log(`   curl http://localhost:${PORT}/test-queries`);

  // Initialize vector store
  await mockVectorStore.initialize();
  console.log('\n✅ Part 4 RAG Pipeline ready for testing!');
});
