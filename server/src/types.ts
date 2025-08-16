export interface AskRequest {
  question: string;
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
}
