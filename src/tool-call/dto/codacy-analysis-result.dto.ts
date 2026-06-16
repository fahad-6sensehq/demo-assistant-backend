export interface CodacyAnalysisResult {
  repositoryUrl: string;
  repositoryName: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  codeCoverage: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  duplicatedFilesPercent: number;
  complexityScore: number;
  securityIssues: number;
  maintainabilityIndex: number;
  lastAnalyzedAt: string;
  languages: string[];
  mock: true;
}
