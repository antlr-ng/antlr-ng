# antlr-ng Unit Tests

## Introduction

Unlike in ANLTR4 there's only one set of unit tests in <span class="antrlng">antlr-ng</span>: those for the tool itself. The original tool unit tests from ANTLR4 were translated to TypeScript and are running now as action on Github. To execute them locally, follow the same step as laid out in the [Getting Started](/getting-started) and the [Building Section](/building-antlr-ng). Download the repository (via git), install dependencies using `npm i` and then run the tests using

```bash
npm run test
```

which will give you:

```zsh
> antlr-ng@1.0.4 test
> vitest --no-watch --no-coverage

 RUN  v3.0.6 .../antlr-ng

 ✓ tests/TestGraphNodes.spec.ts (38 tests | 1 skipped) 7ms 14 MB heap used
 ✓ tests/TestASTStructure.spec.ts (41 tests) 45ms 60 MB heap used
...
 ✓ tests/TestAttributeChecks.spec.ts (121 tests) 1662ms 104 MB heap used
 ✓ tests/TestCompositeGrammars.spec.ts (25 tests) 2133ms 82 MB heap used

 Test Files  43 passed (43)
      Tests  765 passed | 5 skipped (770)
   Start at  14:47:55
   Duration  3.88s
```

All tool unit tests are located in the `tests/` folder. There are no runtime tests in the repository, since they are now the responsibility of the runtime projects.
