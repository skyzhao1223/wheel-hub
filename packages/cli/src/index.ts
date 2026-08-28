#!/usr/bin/env node
import { Command } from "commander";
import { evaluate, getRepo, searchRepos } from "@wheelhub/core";

function parseRepo(input: string): string {
  const match = input.match(/github\.com\/([\w.-]+\/[\w.-]+)/);
  return match ? match[1].replace(/\.git$/, "") : input;
}

async function run(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    if (message.includes("rate limit")) {
      console.error("Tip: export GITHUB_TOKEN=<your token> to raise the limit to 5,000 req/h.");
    }
    process.exitCode = 1;
  }
}

const program = new Command();

program
  .name("wheelhub")
  .description("Stop reinventing the wheel. Find and evaluate open-source solutions.")
  .version("0.1.0");

program
  .command("find")
  .description("Search GitHub for open-source solutions to a problem")
  .argument("<query>", "what to look for, e.g. 'background job scheduler'")
  .option("-l, --lang <language>", "filter by programming language")
  .option("-s, --min-stars <n>", "minimum star count", "100")
  .option("-t, --top <n>", "max results", "10")
  .action(async (query: string, opts: { lang?: string; minStars: string; top: string }) =>
    run(async () => {
      const repos = await searchRepos(query, {
        language: opts.lang,
        minStars: Number(opts.minStars),
        limit: Number(opts.top),
      });
      if (repos.length === 0) {
        console.log("No results found.");
        return;
      }
      repos.forEach((r, i) => {
        console.log(`${i + 1}. ${r.fullName}  ⭐${r.stars.toLocaleString()}  [${r.language ?? "?"}] ${r.license ?? "no license"}`);
        console.log(`   ${r.description ?? ""}`);
        console.log(`   ${r.url}`);
      });
    }),
  );

program
  .command("evaluate")
  .description("Evaluate a repository with a 0-100 score and adopt/adapt/inspect/avoid verdict")
  .argument("<repo>", "repository in 'owner/name' format or a GitHub URL")
  .action(async (repo: string) =>
    run(async () => {
      const e = evaluate(await getRepo(parseRepo(repo)));
      const r = e.repo;
      console.log(`${r.fullName}: ${e.score}/100 [${e.verdict.toUpperCase()}]`);
      console.log(`Stars: ${r.stars.toLocaleString()} | Open issues: ${r.openIssues.toLocaleString()} | License: ${r.license ?? "none"}`);
      console.log(`popularity=${e.breakdown.popularity} momentum=${e.breakdown.momentum} maintenance=${e.breakdown.maintenance} trust=${e.breakdown.trust}`);
      if (e.reasons.length > 0) {
        console.log("");
        e.reasons.forEach((reason) => console.log(`- ${reason}`));
      }
    }),
  );

program.parseAsync();
