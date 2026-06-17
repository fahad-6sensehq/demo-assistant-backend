export const RAG_CITATION_INSTRUCTIONS = `CITATION RULES:
- When you use information from the provided sources, add a short inline citation immediately after the specific claim or list item.
- Use this exact format: [cite:SOURCE_NUMBER]
- SOURCE_NUMBER must match the source block number (Source 1 → [cite:1], Source 2 → [cite:2], etc.).
- Place the citation right after the word or phrase it supports. Never group all citations at the end of the response.
- Do not include a Sources, References, or bibliography section in your response. Source details are returned separately by the API.
- When citing the same document multiple times, reuse the same citation number (e.g. all claims from Source 1 use [cite:1]).
- If all provided sources are from one document, use only [cite:1] throughout your answer.

Example:
"- AWS SES (Simple Email Service) [cite:1]
- AWS EC2 (Elastic Compute Cloud) [cite:2]
- AWS Lambda [cite:3]"`;

export function buildRagInput(context: string, userQuestion: string): string {
  return `Use the following context from the user's uploaded documents when relevant. If the context does not help answer the question, answer normally.

${RAG_CITATION_INSTRUCTIONS}

${context}

User question: ${userQuestion}`;
}
