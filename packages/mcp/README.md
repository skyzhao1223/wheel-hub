# @wheel-hub/mcp

MCP server exposing [wheel-hub](https://github.com/skyzhao1223/wheel-hub) open-source evaluation to AI coding agents (Claude Code, opencode, Cursor, Windsurf, …).

## Tools

| Tool | Description |
|------|-------------|
| `search_oss` | Search GitHub for open-source solutions to a problem |
| `evaluate_repo` | Score one repo (0–100) with adopt/adapt/inspect/avoid verdict |
| `compare_alternatives` | Find alternatives + evaluate each before writing new code |

## Setup

```bash
claude mcp add wheel-hub --env GITHUB_TOKEN=ghp_xxx -- npx @wheel-hub/mcp
```

> Pass `GITHUB_TOKEN` explicitly through your client's `env` config — MCP clients only
> forward a whitelist of environment variables. Without it the server runs at the
> anonymous rate limit (60 req/hour).

## License

MIT
