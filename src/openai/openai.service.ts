import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  FunctionTool,
  ResponseFunctionToolCall,
  ResponseInputItem,
  ResponseOutputItem,
} from 'openai/resources/responses/responses';
import { ToolCallService } from '../tool-call/tool-call.service';

const MAX_TOOL_ITERATIONS = 5;
const EMBEDDING_MODEL = 'text-embedding-3-small';

@Injectable()
export class OpenaiService {
  private readonly client: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly toolCallService: ToolCallService,
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.createEmbeddings([text]);
    return embedding;
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    try {
      const response = await this.client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
      });

      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'OpenAI embedding request failed',
      );
    }
  }

  async createResponse(params: {
    model: string;
    instructions: string;
    input: string;
    previousResponseId?: string | null;
  }): Promise<{ id: string; text: string }> {
    return this.createResponseWithTools({
      ...params,
      tools: this.toolCallService.getTools(),
    });
  }

  async createResponseWithTools(params: {
    model: string;
    instructions: string;
    input: string;
    previousResponseId?: string | null;
    tools?: FunctionTool[];
  }): Promise<{ id: string; text: string }> {
    const tools = params.tools ?? this.toolCallService.getTools();
    const toolInstructions = `${params.instructions}

You have access to third-party tools. When a user asks about repository code quality, Codacy scores, coverage, or issues, call get_codacy_score with their repository URL and summarize the results clearly.`;

    let previousResponseId = params.previousResponseId ?? undefined;
    let input: string | ResponseInputItem[] = params.input;

    try {
      for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
        const response = await this.client.responses.create({
          model: params.model,
          instructions: toolInstructions,
          input,
          previous_response_id: previousResponseId,
          tools,
          store: true,
        });

        const functionCalls = this.extractFunctionCalls(response.output);

        if (functionCalls.length === 0) {
          return {
            id: response.id,
            text: this.extractText(response.output),
          };
        }

        this.logger.log(
          `OpenAI requested ${functionCalls.length} tool call(s)`,
        );

        const toolInput = await this.buildToolInput(functionCalls);
        previousResponseId = response.id;
        input = toolInput;
      }

      throw new InternalServerErrorException(
        'Exceeded maximum tool call iterations',
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'OpenAI request failed',
      );
    }
  }

  private extractFunctionCalls(
    output: ResponseOutputItem[],
  ): ResponseFunctionToolCall[] {
    return output.filter(
      (item): item is ResponseFunctionToolCall => item.type === 'function_call',
    );
  }

  private async buildToolInput(
    functionCalls: ResponseFunctionToolCall[],
  ): Promise<ResponseInputItem[]> {
    const toolInput: ResponseInputItem[] = [];

    for (const call of functionCalls) {
      toolInput.push({
        type: 'function_call',
        call_id: call.call_id,
        name: call.name,
        arguments: call.arguments,
      });

      let output: string;

      try {
        const args = JSON.parse(call.arguments) as Record<string, unknown>;
        const result = await this.toolCallService.executeTool(call.name, args);
        output = JSON.stringify(result);
      } catch (error) {
        output = JSON.stringify({
          error:
            error instanceof Error ? error.message : 'Tool execution failed',
        });
      }

      toolInput.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output,
      });
    }

    return toolInput;
  }

  private extractText(output: ResponseOutputItem[]): string {
    const text = output
      .filter((item) => item.type === 'message')
      .flatMap((item) => (item.type === 'message' ? item.content : []))
      .filter((part) => part.type === 'output_text')
      .map((part) => (part.type === 'output_text' ? part.text : ''))
      .join('\n')
      .trim();

    if (text) {
      return text;
    }

    return 'I completed the tool call but could not generate a final response.';
  }
}
