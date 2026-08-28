import type { Evaluation, RepoData, ScoreBreakdown, Verdict } from "./types.js";

const DAY = 86_400_000;

const PERMISSIVE_LICENSES = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "Unlicense",
  "CC0-1.0",
  "WTFPL",
]);

const COPYLEFT_LICENSES = new Set(["GPL-2.0", "GPL-3.0", "AGPL-3.0", "LGPL-2.1", "LGPL-3.0"]);

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / DAY;
}

function scorePopularity(stars: number): number {
  return clamp((Math.log10(stars + 1) / Math.log10(500_000)) * 100);
}

function scoreMomentum(repo: RepoData): number {
  const ageDays = Math.max(daysSince(repo.createdAt), 1);
  const starsPerDay = repo.stars / ageDays;
  const norm = clamp((Math.log10(starsPerDay + 1) / Math.log10(50)) * 100);
  const lastPushDays = daysSince(repo.pushedAt);
  const recency = clamp(100 - (lastPushDays / 365) * 100);
  return clamp(norm * 0.6 + recency * 0.4);
}

function scoreMaintenance(repo: RepoData): number {
  const lastPushDays = daysSince(repo.pushedAt);
  const freshness = clamp(100 - (lastPushDays / 180) * 100);
  const issueRatio = repo.stars > 0 ? repo.openIssues / repo.stars : 0;
  const backlog = clamp(100 - issueRatio * 250);
  return clamp(freshness * 0.6 + backlog * 0.4);
}

function scoreTrust(repo: RepoData): number {
  let score = 50;
  if (!repo.license) {
    score -= 30;
  } else if (PERMISSIVE_LICENSES.has(repo.license)) {
    score += 40;
  } else if (COPYLEFT_LICENSES.has(repo.license)) {
    score -= 10;
  }
  if (repo.archived) score -= 50;
  return clamp(score);
}

function verdictFor(score: number, repo: RepoData): Verdict {
  if (repo.archived || score < 35) return "avoid";
  if (score >= 75) return "adopt";
  if (score >= 55) return "adapt";
  return "inspect";
}

function buildReasons(repo: RepoData, breakdown: ScoreBreakdown): string[] {
  const reasons: string[] = [];
  const pushDays = Math.round(daysSince(repo.pushedAt));
  const ageDays = Math.round(daysSince(repo.createdAt));

  if (repo.stars >= 10_000) reasons.push(`Widely adopted (${repo.stars.toLocaleString()} stars).`);
  if (pushDays <= 30) reasons.push(`Actively maintained (last push ${pushDays}d ago).`);
  else if (pushDays > 365) reasons.push(`Stale: no commits in over a year (${pushDays}d).`);

  if (!repo.license) reasons.push("No license detected — legal risk for commercial use.");
  else if (COPYLEFT_LICENSES.has(repo.license)) reasons.push(`Copyleft license (${repo.license}) may impose obligations.`);
  else if (PERMISSIVE_LICENSES.has(repo.license)) reasons.push(`Permissive license (${repo.license}).`);

  if (repo.archived) reasons.push("Repository is archived — unmaintained upstream.");
  if (repo.openIssues > repo.stars * 0.3 && repo.stars > 1000) {
    reasons.push("High open-issue backlog relative to community size.");
  }
  if (ageDays <= 365 && breakdown.momentum >= 70) reasons.push("Young project with strong growth momentum.");

  return reasons;
}

export function evaluate(repo: RepoData): Evaluation {
  const breakdown: ScoreBreakdown = {
    popularity: Math.round(scorePopularity(repo.stars)),
    momentum: Math.round(scoreMomentum(repo)),
    maintenance: Math.round(scoreMaintenance(repo)),
    trust: Math.round(scoreTrust(repo)),
  };
  const score = Math.round(
    breakdown.popularity * 0.3 + breakdown.momentum * 0.25 + breakdown.maintenance * 0.3 + breakdown.trust * 0.15,
  );
  return {
    repo,
    score,
    breakdown,
    verdict: verdictFor(score, repo),
    reasons: buildReasons(repo, breakdown),
  };
}
