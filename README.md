# ⚙️ wheel-hub

**Stop reinventing the wheel. Search, score and adopt the best open-source solutions — before you write a line of code.**

wheel-hub is an MCP server + CLI that makes both AI coding agents and humans check the open-source ecosystem first: given a feature or problem, it finds existing solutions and scores them on popularity, momentum, maintenance and trust, then tells you whether to **adopt**, **adapt**, **inspect** or **avoid**.

## Why

Every developer (and every AI agent) rebuilds auth, schedulers, scrapers and admin panels from scratch — not because better wheels don't exist, but because nobody looks for them first. wheel-hub makes "look first" the default.

## Install

### MCP server (for Claude Code, opencode, Cursor, …)

```bash
npx @wheel-hub/mcp
```

Claude Code example:

```bash
claude mcp add wheel-hub --env GITHUB_TOKEN=ghp_xxx -- npx @wheel-hub/mcp
```

Generic JSON config example (works in most MCP clients):

```json
{
  "mcpServers": {
    "wheel-hub": {
      "command": "npx",
      "args": ["@wheel-hub/mcp"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    }
  }
}
```

> **Note:** MCP clients only forward a whitelist of environment variables to servers.
> Always pass `GITHUB_TOKEN` explicitly through the client's `env` config, or the server
> will run unauthenticated at 60 requests/hour and hit rate limits quickly.

Then just ask your agent: *"before you implement, use wheel-hub to check what exists for background job scheduling"*.

### CLI (for humans)

```bash
npx wheel-hub find "SSO login" --lang typescript
npx wheel-hub evaluate ollama/ollama
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
| [`@wheel-hub/core`](https://www.npmjs.com/package/@wheel-hub/core) | GitHub aggregation + scoring engine |
| [`@wheel-hub/mcp`](https://www.npmjs.com/package/@wheel-hub/mcp) | MCP server for AI agents |
| [`wheel-hub`](https://www.npmjs.com/package/wheel-hub) | Terminal CLI |

## Roadmap

- [ ] Awesome-list mining as a secondary signal source
- [ ] Star-history curves via OSSInsight data
- [ ] `wheel-hub watch` — get notified when your stack's dependencies go stale
- [ ] Score persistence + weekly digest

## License

MIT
