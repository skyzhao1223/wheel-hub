import type { RepoData, SearchOptions } from "./types.js";

const API = "https://api.github.com";

interface RawRepo {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  pushed_at: string;
  archived: boolean;
  license: { spdx_id: string } | null;
  language: string | null;
  topics?: string[];
}

function toRepoData(raw: RawRepo): RepoData {
  return {
    fullName: raw.full_name,
    description: raw.description,
    url: raw.html_url,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count,
    createdAt: raw.created_at,
    pushedAt: raw.pushed_at,
    archived: raw.archived,
    license: raw.license && raw.license.spdx_id !== "NOASSERTION" ? raw.license.spdx_id : null,
    language: raw.language,
    topics: raw.topics ?? [],
  };
}

async function ghFetch(path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "wheelhub",
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { headers });
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get("x-ratelimit-reset");
    const waitSec = reset ? Math.ceil((Number(reset) * 1000 - Date.now()) / 1000) : 60;
    throw new Error(
      `GitHub rate limit exceeded. Set GITHUB_TOKEN to raise the limit${reset ? `; resets in ~${waitSec}s` : ""}.`,
    );
  }
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Repository not found: ${path.replace(/^\/repos\//, "")}`);
    }
    throw new Error(`GitHub API error ${res.status} for ${path}`);
  }
  return res.json();
}

export async function searchRepos(query: string, options: SearchOptions = {}): Promise<RepoData[]> {
  const parts = [query];
  if (options.language) parts.push(`language:${options.language}`);
  parts.push(`stars:>=${options.minStars ?? 100}`);
  const limit = Math.min(options.limit ?? 10, 100);

  const q = encodeURIComponent(parts.join(" "));
  const data = (await ghFetch(`/search/repositories?q=${q}&sort=stars&order=desc&per_page=${limit}`)) as {
    items: RawRepo[];
  };
  return data.items.map(toRepoData);
}

export async function getRepo(fullName: string): Promise<RepoData> {
  const raw = (await ghFetch(`/repos/${fullName}`)) as RawRepo;
  return toRepoData(raw);
}
