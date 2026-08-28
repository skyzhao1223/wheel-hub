# Container image for running the wheel-hub MCP server (stdio transport).
# Used by Glama (https://glama.ai/mcp/servers) and anyone who prefers
# running the server in Docker instead of npx.
FROM node:24-alpine

# Install the published MCP server package.
RUN npm install -g @wheel-hub/mcp

# Optional: pass a GitHub token at runtime to raise the API rate limit
# from 60 req/h (anonymous) to 5,000 req/h.
# docker run -e GITHUB_TOKEN=ghp_xxx ...

CMD ["wheel-hub-mcp"]
