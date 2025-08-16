import { readFileSync } from 'fs';
import { join } from 'path';
import { embed, cosineSimilarity } from './embedder.js';

interface ChunkData {
  id: string;
  url: string;
  title: string;
  section?: string;
  tokens: number;
  text: string;
}

interface VectorChunk extends ChunkData {
  embedding?: number[];
}

interface SearchResult {
  chunk: ChunkData;
  similarity: number;
}

class VectorStore {
  private chunks: VectorChunk[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing vector store...');

    // Load chunks from the ingestion pipeline
    const chunksPath = join(process.cwd(), '../data/chunks/chunks.jsonl');
    const chunksData = readFileSync(chunksPath, 'utf-8');

    this.chunks = chunksData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as ChunkData);

    console.log(`Loaded ${this.chunks.length} chunks`);

    // Generate embeddings for all chunks
    console.log('Generating embeddings...');
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      try {
        const result = await embed(chunk.text);
        chunk.embedding = result.embedding;

        if ((i + 1) % 50 === 0) {
          console.log(`Generated embeddings for ${i + 1}/${this.chunks.length} chunks`);
        }
      } catch (error) {
        console.error(`Failed to embed chunk ${chunk.id}:`, error);
      }
    }

    this.initialized = true;
    console.log('Vector store initialization complete');
  }

  async searchDocs(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate embedding for the query
    const queryResult = await embed(query);
    const queryEmbedding = queryResult.embedding;

    // Calculate similarities
    const results: SearchResult[] = [];

    for (const chunk of this.chunks) {
      if (chunk.embedding) {
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
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

  getStats(): { totalChunks: number; embeddedChunks: number } {
    const embeddedChunks = this.chunks.filter(chunk => chunk.embedding).length;
    return {
      totalChunks: this.chunks.length,
      embeddedChunks
    };
  }
}

export const vectorStore = new VectorStore();
