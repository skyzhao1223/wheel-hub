# @wheel-hub/core

GitHub data aggregation and smart evaluation scoring engine behind [wheel-hub](https://github.com/skyzhao1223/wheel-hub).

## Usage

```ts
import { searchRepos, evaluate } from "@wheel-hub/core";

const repos = await searchRepos("background job scheduler", { language: "TypeScript", limit: 5 });
const evaluations = repos.map(evaluate).sort((a, b) => b.score - a.score);

console.log(evaluations[0].score, evaluations[0].verdict, evaluations[0].reasons);
```

## Scoring model

Composite 0–100 score: popularity 30% · momentum 25% · maintenance 30% · trust 15%.
Verdicts: `≥75 adopt` · `≥55 adapt` · `≥35 inspect` · `<35 / archived → avoid`.

## License

MIT
