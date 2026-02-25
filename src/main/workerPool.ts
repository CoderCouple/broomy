/**
 * Runs a function in a worker thread and returns the result as a promise.
 *
 * Supports progress callbacks for long-running operations. Workers communicate
 * via a simple message protocol with 'progress', 'result', and 'error' types.
 */
import { Worker } from 'worker_threads'

export function runInWorker<TOutput>(
  workerPath: string,
  data: unknown,
  onProgress?: (progress: { message: string; percent?: number }) => void
): Promise<TOutput> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { workerData: data })
    worker.on('message', (msg) => {
      if (msg.type === 'progress' && onProgress) onProgress(msg.data)
      else if (msg.type === 'result') resolve(msg.data)
      else if (msg.type === 'error') reject(new Error(msg.error))
    })
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`))
    })
  })
}
