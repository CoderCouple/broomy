# Workers

Worker thread scripts for CPU-intensive tasks that would block the main Electron process. Each worker receives input via `workerData`, performs its computation off the main thread, and posts results back through `parentPort`.

## How It Connects

Workers are spawned by the main process worker pool (`src/main/workerPool.ts`). The `fsSearch` handler and `typescript` handler in `src/main/handlers/` call `runInWorker()` to delegate work to these scripts. Results flow back to the renderer through the normal IPC request/response pattern.

## Files

| File | Description |
|------|-------------|
| `fsSearch.worker.ts` | Recursively searches a directory for files matching a query by filename and content. Skips binary files, respects size limits, and caps results at 500. |
| `tsProject.worker.ts` | Reads a TypeScript project's `tsconfig.json` (with `extends` resolution) and collects all source files for Monaco IntelliSense. Caps at 2000 files. |
| `fsSearch.worker.test.ts` | Unit tests for the filesystem search worker. |
| `tsProject.worker.test.ts` | Unit tests for the TypeScript project worker. |
