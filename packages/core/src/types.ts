export interface RepoData {
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  pushedAt: string;
  archived: boolean;
  license: string | null;
  language: string | null;
  topics: string[];
}

export interface ScoreBreakdown {
  popularity: number;
  momentum: number;
  maintenance: number;
  trust: number;
}

export type Verdict = "adopt" | "adapt" | "inspect" | "avoid";

export interface Evaluation {
  repo: RepoData;
  score: number;
  breakdown: ScoreBreakdown;
  verdict: Verdict;
  reasons: string[];
}

export interface SearchOptions {
  language?: string;
  minStars?: number;
  limit?: number;
}
