import type { Map } from 'es6-map';

interface BatchProgressData {
  status: 'running' | 'completed' | 'error';
  progress: number;
  stage: string;
  metrics: {
    totalFetched: number;
    totalProcessed: number;
    totalInserted: number;
    totalUpdated: number;
    totalDeduplicated: number;
    totalErrors: number;
    errors: string[];
  };
  lastUpdate: Date;
}

declare global {
  var batchProgressStore: Map<string, BatchProgressData> | undefined;
  var updateBatchProgress: ((batchId: string, data: Omit<BatchProgressData, 'lastUpdate'>) => void) | undefined;
}

export {};