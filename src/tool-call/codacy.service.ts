import { Injectable } from '@nestjs/common';
import { CodacyAnalysisResult } from './dto/codacy-analysis-result.dto';

const LANGUAGE_POOL = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Java',
  'C#',
  'Ruby',
  'PHP',
];

@Injectable()
export class CodacyService {
  async getCodacyScore(repositoryUrl: string): Promise<CodacyAnalysisResult> {
    await this.simulateNetworkDelay();

    const repositoryName = this.extractRepositoryName(repositoryUrl);
    const codeCoverage = this.randomInt(45, 98);
    const criticalIssues = this.randomInt(0, 4);
    const highIssues = this.randomInt(0, 12);
    const mediumIssues = this.randomInt(2, 35);
    const lowIssues = this.randomInt(5, 60);
    const totalIssues = criticalIssues + highIssues + mediumIssues + lowIssues;
    const securityIssues = this.randomInt(0, 8);
    const duplicatedFilesPercent = this.randomInt(0, 18);
    const complexityScore = this.randomInt(20, 95);
    const maintainabilityIndex = this.randomInt(55, 99);

    return {
      repositoryUrl,
      repositoryName,
      grade: this.calculateGrade({
        codeCoverage,
        totalIssues,
        criticalIssues,
        securityIssues,
      }),
      codeCoverage,
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      duplicatedFilesPercent,
      complexityScore,
      securityIssues,
      maintainabilityIndex,
      lastAnalyzedAt: new Date().toISOString(),
      languages: this.pickLanguages(),
      mock: true,
    };
  }

  private extractRepositoryName(repositoryUrl: string): string {
    try {
      const url = new URL(repositoryUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      }
      return parts.at(-1) ?? repositoryUrl;
    } catch {
      return repositoryUrl;
    }
  }

  private calculateGrade(metrics: {
    codeCoverage: number;
    totalIssues: number;
    criticalIssues: number;
    securityIssues: number;
  }): CodacyAnalysisResult['grade'] {
    let score = 100;

    score -= metrics.criticalIssues * 12;
    score -= metrics.securityIssues * 8;
    score -= Math.min(metrics.totalIssues, 40) * 0.8;
    score += metrics.codeCoverage * 0.15;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private pickLanguages(): string[] {
    const count = this.randomInt(1, 3);
    const shuffled = [...LANGUAGE_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delayMs = this.randomInt(300, 900);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
