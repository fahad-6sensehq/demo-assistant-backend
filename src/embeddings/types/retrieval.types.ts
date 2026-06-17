export interface RetrievedSource {
  index: number;
  fileId: string;
  fileName: string;
  excerpt: string;
  score: number;
}

export interface RetrievalResult {
  context: string;
  sources: RetrievedSource[];
}
