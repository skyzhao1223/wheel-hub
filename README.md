# ⚙️ wheelhub

**Stop reinventing the wheel. Search, score and adopt the best open-source solutions — before you write a line of code.**

wheelhub is an MCP server + CLI that makes both AI coding agents and humans check the open-source ecosystem first: given a feature or problem, it finds existing solutions and scores them on popularity, momentum, maintenance and trust, then tells you whether to **adopt**, **adapt**, **inspect** or **avoid**.

## Why

Every developer (and every AI agent) rebuilds auth, schedulers, scrapers and admin panels from scratch — not because better wheels don't exist, but because nobody looks for them first. wheelhub makes "look first" the default.

## Install

### MCP server (for Claude Code, opencode, Cursor, …)

```bash
npx @wheelhub/mcp
```

Claude Code example:

```bash
claude mcp add wheelhub --env GITHUB_TOKEN=ghp_xxx -- npx @wheelhub/mcp
```

Generic JSON config example (works in most MCP clients):

```json
{
  "mcpServers": {
    "wheelhub": {
      "command": "npx",
      "args": ["@wheelhub/mcp"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    }
  }
}
```

> **Note:** MCP clients only forward a whitelist of environment variables to servers.
> Always pass `GITHUB_TOKEN` explicitly through the client's `env` config, or the server
> will run unauthenticated at 60 requests/hour and hit rate limits quickly.

Then just ask your agent: *"before you implement, use wheelhub to check what exists for background job scheduling"*.

### CLI (for humans)

```bash
npx @wheelhub/cli find "SSO login" --lang typescript
npx @wheelhub/cli evaluate ollama/ollama
```

## Tools

| Tool | Description |
|------|-------------|
| `search_oss` | Search GitHub for solutions to a problem |
| `evaluate_repo` | Score one repo (0–100) with a verdict and reasons |
| `compare_alternatives` | Find alternatives + evaluate each — run this before writing new code |

## Scoring model

Composite score (0–100) weighted across four dimensions:

- **Popularity (30%)** — star mass on a log scale
- **Momentum (25%)** — stars/day growth + recency of pushes
- **Maintenance (30%)** — commit freshness + issue backlog ratio
- **Trust (15%)** — license permissiveness, archived status

Verdicts: `≥75 adopt` · `≥55 adapt` · `≥35 inspect` · `<35 / archived avoid`

## Configuration

`GITHUB_TOKEN` (optional) — raises the GitHub API rate limit from 60 to 5,000 requests/hour. Strongly recommended for real use; see the MCP config above for how to pass it.

## Packages

| Package | Description |
|---------|-------------|
| [`@wheelhub/core`](https://www.npmjs.com/package/@wheelhub/core) | GitHub aggregation + scoring engine |
| [`@wheelhub/mcp`](https://www.npmjs.com/package/@wheelhub/mcp) | MCP server for AI agents |
| [`@wheelhub/cli`](https://www.npmjs.com/package/@wheelhub/cli) | Terminal CLI |

## Roadmap

- [ ] Awesome-list mining as a secondary signal source
- [ ] Star-history curves via OSSInsight data
- [ ] `wheelhub watch` — get notified when your stack's dependencies go stale
- [ ] Score persistence + weekly digest

## License

MIT
