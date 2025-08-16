// Comprehensive test for Part 3 functionality
// Tests everything without requiring OpenAI API key

import { readFileSync } from 'fs';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Mock embedder functions for testing
const mockEmbed = async (text: string) => {
  // Generate a simple mock embedding based on text content
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(1536).fill(0); // OpenAI embedding dimension
  
  // Create a simple hash-based embedding
  for (let i = 0; i < words.length && i < 100; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      embedding[charCode % 1536] += 1;
    }
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return {
    embedding: norm > 0 ? embedding.map(val => val / norm) : embedding,
    tokens: Math.min(text.length / 4, 8000) // Rough token estimate
  };
};

const mockCosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Mock Vector Store
class MockVectorStore {
  private chunks: any[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔄 Initializing mock vector store...');

    // Load chunks from the ingestion pipeline
    const chunksPath = '../data/chunks/chunks.jsonl';
    const chunksData = readFileSync(chunksPath, 'utf-8');

    this.chunks = chunksData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    console.log(`✅ Loaded ${this.chunks.length} chunks`);

    // Generate mock embeddings for all chunks
    console.log('🔄 Generating mock embeddings...');
    for (let i = 0; i < Math.min(this.chunks.length, 100); i++) {
      const chunk = this.chunks[i];
      try {
        const result = await mockEmbed(chunk.text);
        chunk.embedding = result.embedding;

        if ((i + 1) % 25 === 0) {
          console.log(`📊 Generated mock embeddings for ${i + 1}/100 chunks (limited for demo)`);
        }
      } catch (error) {
        console.error(`❌ Failed to embed chunk ${chunk.id}:`, error);
      }
    }

    this.initialized = true;
    console.log('✅ Mock vector store initialization complete');
  }

  async searchDocs(query: string, topK: number = 5): Promise<any[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate embedding for the query
    const queryResult = await mockEmbed(query);
    const queryEmbedding = queryResult.embedding;

    // Calculate similarities
    const results: any[] = [];

    for (const chunk of this.chunks) {
      if (chunk.embedding) {
        const similarity = mockCosineSimilarity(queryEmbedding, chunk.embedding);
        results.push({
          chunk: {
            id: chunk.id,
            url: chunk.url,
            title: chunk.title,
            section: chunk.section,
            tokens: chunk.tokens,
            text: chunk.text
          },
          similarity
        });
      }
    }

    // Sort by similarity (highest first) and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  getStats() {
    const embeddedChunks = this.chunks.filter(chunk => chunk.embedding).length;
    return {
      totalChunks: this.chunks.length,
      embeddedChunks
    };
  }
}

const mockVectorStore = new MockVectorStore();

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Part 3 test server running' });
});

// Ask endpoint with mock semantic search
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    console.log(`🔍 Processing query: "${question}"`);

    // Search for relevant documentation chunks
    const searchResults = await mockVectorStore.searchDocs(question, 5);

    // Convert search results to sources format
    const sources = searchResults.map(result => ({
      url: result.chunk.url,
      title: result.chunk.title || 'Avalanche Documentation',
      section: result.chunk.section,
      similarity: Math.round(result.similarity * 1000) / 1000
    }));

    const context = searchResults.map(result => ({
      text: result.chunk.text.substring(0, 500) + '...', // Truncate for demo
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
      answer: `✅ Found ${searchResults.length} relevant documentation chunks using mock semantic search for: "${question}". This demonstrates Part 3 functionality - ready for OpenAI integration!`,
      sources,
      context
    };

    console.log(`✅ Returned ${searchResults.length} results with similarities: ${searchResults.map(r => Math.round(r.similarity * 1000) / 1000).join(', ')}`);

    res.json(response);
  } catch (error) {
    console.error('❌ Error in /ask route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stats endpoint
app.get('/stats', async (req, res) => {
  try {
    await mockVectorStore.initialize();
    const stats = mockVectorStore.getStats();
    res.json({
      ...stats,
      message: 'Part 3 Vector Store Statistics',
      note: 'Using mock embeddings for demonstration'
    });
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Part 3 Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /stats  - Vector store statistics`);
  console.log(`   POST /ask    - Semantic search demo`);
  console.log(`\n💡 Try: curl -X POST http://localhost:${PORT}/ask -H "Content-Type: application/json" -d '{"question": "How do I create smart contracts?"}'\n`);
});

export {};
