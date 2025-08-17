import { readFileSync } from 'fs';
import { embed, cosineSimilarity } from './embedder';

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
    const chunksPath = '../data/chunks/chunks.jsonl';
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

    // Try to generate embedding for the query
    try {
      const queryResult = await embed(query);
      const queryEmbedding = queryResult.embedding;

      return this.performSemanticSearch(queryEmbedding, topK);
    } catch (error) {
      console.log('Cannot perform semantic search, falling back to simple text matching');
      return this.performTextSearch(query, topK);
    }
  }

  private performSemanticSearch(queryEmbedding: number[], topK: number): SearchResult[] {
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

  private performTextSearch(query: string, topK: number): SearchResult[] {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const results: SearchResult[] = [];

    for (const chunk of this.chunks) {
      const content = chunk.text.toLowerCase();
      let score = 0;

      // Simple text matching score based on word frequency
      for (const word of queryWords) {
        const regex = new RegExp(word, 'gi');
        const matches = content.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      if (score > 0) {
        results.push({
          chunk: {
            id: chunk.id,
            url: chunk.url,
            title: chunk.title,
            section: chunk.section,
            tokens: chunk.tokens,
            text: chunk.text
          },
          similarity: score / (content.length / 1000), // Normalize by content length
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
