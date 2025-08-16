export interface AskRequest {
  question: string;
}

export interface AskResponse {
  answer: string;
  sources: Array<{ title: string; url?: string }>;
}
