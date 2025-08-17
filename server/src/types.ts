export interface AskRequest {
  question: string;
}

export interface DocumentChunk {
  id: string;
  url: string;
  title: string;
  section?: string;
  tokens: number;
  text: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

export interface Source {
  title: string;
  url?: string;
  section?: string;
  similarity?: number;
}

export interface ContextChunk {
  text: string;
  metadata: {
    id: string;
    url: string;
    title: string;
    section?: string;
    tokens: number;
    similarity: number;
  };
}

export interface AskResponse {
  answer: string;
  sources: Source[];
  context?: ContextChunk[];
  provider?: string;
  tokensUsed?: number;
}
