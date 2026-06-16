import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { FunctionTool } from 'openai/resources/responses/responses';
import { CodacyService } from './codacy.service';
import { AVAILABLE_TOOLS } from './tools/codacy.tool';

@Injectable()
export class ToolCallService {
  private readonly logger = new Logger(ToolCallService.name);

  constructor(private readonly codacyService: CodacyService) {}

  getTools(): FunctionTool[] {
    return AVAILABLE_TOOLS;
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    this.logger.log(`Executing tool: ${name}`);

    switch (name) {
      case 'get_codacy_score': {
        const repositoryUrl = args.repositoryUrl;
        if (typeof repositoryUrl !== 'string' || !repositoryUrl.trim()) {
          throw new BadRequestException(
            'repositoryUrl is required for get_codacy_score',
          );
        }
        return this.codacyService.getCodacyScore(repositoryUrl.trim());
      }
      default:
        throw new BadRequestException(`Unknown tool: ${name}`);
    }
  }
}
