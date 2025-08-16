// Test vector store initialization without OpenAI
const { readFileSync } = require('fs');

console.log('Testing vector store initialization...');

class MockVectorStore {
  constructor() {
    this.chunks = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Loading chunks...');

    // Load chunks from the ingestion pipeline
    const chunksPath = '../data/chunks/chunks.jsonl';
    const chunksData = readFileSync(chunksPath, 'utf-8');

    this.chunks = chunksData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    console.log(`✓ Loaded ${this.chunks.length} chunks`);

    // Show some sample chunks
    const samples = this.chunks.slice(0, 3).map(chunk => ({
      id: chunk.id,
      title: chunk.title,
      tokens: chunk.tokens,
      textPreview: chunk.text.substring(0, 100) + '...'
    }));

    console.log('Sample chunks:', JSON.stringify(samples, null, 2));

    this.initialized = true;
  }

  getStats() {
    return {
      totalChunks: this.chunks.length,
      embeddedChunks: 0 // Would be non-zero with actual embeddings
    };
  }
}

// Test the mock
async function test() {
  const vectorStore = new MockVectorStore();
  await vectorStore.initialize();
  console.log('Stats:', vectorStore.getStats());
}

test().catch(console.error);
