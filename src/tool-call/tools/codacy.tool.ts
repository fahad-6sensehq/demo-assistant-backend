import type { FunctionTool } from 'openai/resources/responses/responses';

export const GET_CODACY_SCORE_TOOL: FunctionTool = {
  type: 'function',
  name: 'get_codacy_score',
  description:
    'Fetch Codacy code quality analysis for a Git repository. Returns grade, code coverage, issue counts, duplication, complexity, and security findings.',
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      repositoryUrl: {
        type: 'string',
        description:
          'Full Git repository URL, e.g. https://github.com/acme/my-service',
      },
    },
    required: ['repositoryUrl'],
    additionalProperties: false,
  },
};

export const AVAILABLE_TOOLS: FunctionTool[] = [GET_CODACY_SCORE_TOOL];
