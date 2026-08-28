#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { evaluate, getRepo, searchRepos } from "@wheel-hub/core";

function parseRepo(input: string): string {
  const match = input.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
  return match ? match[1].replace(/\.git$/, "") : input;
}

const server = new McpServer({
  name: "wheel-hub",
  version: "0.1.0",
});

server.tool(
  "search_oss",
  "Search GitHub for high-quality open-source solutions before implementing a feature. Returns ranked candidates with stars and descriptions.",
  {
    query: z.string().describe("What to look for, e.g. 'background job scheduler', 'SSO login'"),
    language: z.string().optional().describe("Filter by programming language"),
    min_stars: z.number().optional().describe("Minimum star count (default 100)"),
    limit: z.number().optional().describe("Max results (default 10)"),
  },
  async ({ query, language, min_stars, limit }) => {
    const repos = await searchRepos(query, { language, minStars: min_stars, limit });
    const text = repos
      .map(
        (r, i) =>
          `${i + 1}. ${r.fullName} — ⭐${r.stars.toLocaleString()} | ${r.language ?? "?"} | ${r.license ?? "no license"} | ${r.description ?? ""}\n   ${r.url}`,
      )
      .join("\n");
    return { content: [{ type: "text", text: text || "No results found." }] };
  },
);

server.tool(
  "evaluate_repo",
  "Score a single GitHub repository (0-100) on popularity, momentum, maintenance and trust, with an adopt/adapt/inspect/avoid verdict.",
  {
    repo: z.string().describe("Repository in 'owner/name' format or a GitHub URL"),
  },
  async ({ repo }) => {
    const evaluation = evaluate(await getRepo(parseRepo(repo)));
    const r = evaluation.repo;
    const text = [
      `${r.fullName}: ${evaluation.score}/100 [${evaluation.verdict.toUpperCase()}]`,
      `Stars: ${r.stars.toLocaleString()} | Open issues: ${r.openIssues.toLocaleString()} | License: ${r.license ?? "none"} | Archived: ${r.archived}`,
      `Breakdown: popularity=${evaluation.breakdown.popularity} momentum=${evaluation.breakdown.momentum} maintenance=${evaluation.breakdown.maintenance} trust=${evaluation.breakdown.trust}`,
      ...evaluation.reasons.map((reason) => `- ${reason}`),
      r.url,
    ].join("\n");
    return { content: [{ type: "text", text }] };
  },
);

server.tool(
  "compare_alternatives",
  "Search for alternatives to a feature/tool and evaluate each one. Use before writing new code to avoid reinventing the wheel. Returns a ranked verdict table.",
  {
    query: z.string().describe("Feature or capability to find alternatives for"),
    language: z.string().optional().describe("Preferred programming language"),
    top: z.number().optional().describe("Number of candidates to evaluate (default 5)"),
  },
  async ({ query, language, top }) => {
    const repos = await searchRepos(query, { language, limit: top ?? 5 });
    const evaluations = repos.map(evaluate).sort((a, b) => b.score - a.score);
    const header = `${"repo".padEnd(38)} ${"score".padStart(5)} ${"verdict".padEnd(8)} stars`;
    const rows = evaluations.map((e) => {
      const name = e.repo.fullName.length > 37 ? e.repo.fullName.slice(0, 36) + "…" : e.repo.fullName;
      return `${name.padEnd(38)} ${String(e.score).padStart(5)} ${e.verdict.padEnd(8)} ${e.repo.stars.toLocaleString()}`;
    });
    const best = evaluations[0];
    const footer = best
      ? `\nBest: ${best.repo.fullName} (${best.score}/100, ${best.verdict}) — ${best.reasons[0] ?? ""}\n${best.repo.url}`
      : "";
    return {
      content: [{ type: "text", text: [header, ...rows].join("\n") + footer }],
    };
  },
);

await server.connect(new StdioServerTransport());
