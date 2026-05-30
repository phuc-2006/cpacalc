/// <reference lib="webworker" />
import type { ClassSection, Constraints, SolverProgress, SolverResult } from '@/types/scheduler';
import { solve } from './solver';

export interface SolverWorkerRequest {
  sections: ClassSection[];
  selectedCodes: string[];
  constraints: Partial<Constraints>;
  maxResults?: number;
  maxNodes?: number;
}

export type SolverWorkerMessage =
  | { kind: 'progress'; progress: SolverProgress }
  | { kind: 'done'; result: SolverResult }
  | { kind: 'error'; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<SolverWorkerRequest>) => {
  const { sections, selectedCodes, constraints, maxResults, maxNodes } = event.data;
  try {
    const result = solve(sections, selectedCodes, constraints, {
      maxResults,
      maxNodes,
      onProgress: (progress) => ctx.postMessage({ kind: 'progress', progress } satisfies SolverWorkerMessage),
    });
    ctx.postMessage({ kind: 'done', result } satisfies SolverWorkerMessage);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.postMessage({ kind: 'error', message } satisfies SolverWorkerMessage);
  }
};
