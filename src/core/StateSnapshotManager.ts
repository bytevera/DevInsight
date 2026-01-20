import { StateSnapshot, DevInsightConfig } from '../types';
import { DataMasker } from '../utils/DataMasker';

/**
 * StateSnapshotManager
 * 
 * Captures and manages state snapshots including watched variables,
 * process metrics, and runtime state.
 */
export class StateSnapshotManager {
    private watchedVariables: Map<string, any> = new Map();
    private dataMasker: DataMasker;

    constructor(config: DevInsightConfig) {
        this.dataMasker = new DataMasker(config.masking);
    }

    /**
     * Register variables to watch
     */
    public watch(variableName: string, value: any): void {
        this.watchedVariables.set(variableName, this.cloneValue(value));
    }

    /**
     * Update watched variable
     */
    public updateWatch(variableName: string, newValue: any): void {
        if (!this.watchedVariables.has(variableName)) {
            console.warn(`[DevInsight] Variable "${variableName}" is not being watched`);
            return;
        }
        this.watchedVariables.set(variableName, this.cloneValue(newValue));
    }

    /**
     * Remove variable from watch list
     */
    public unwatch(variableName: string): void {
        this.watchedVariables.delete(variableName);
    }

    /**
     * Capture current state snapshot
     */
    public captureSnapshot(): StateSnapshot {
        const snapshot: StateSnapshot = {
            watchedVariables: this.captureWatchedVariables(),
            process: {
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                uptime: process.uptime(),
            },
            timestamp: Date.now(),
        };

        // Calculate event loop lag (simplified)
        snapshot.eventLoopLag = this.measureEventLoopLag();

        return snapshot;
    }

    /**
     * Capture watched variables with masking
     */
    private captureWatchedVariables(): Record<string, any> {
        const captured: Record<string, any> = {};

        this.watchedVariables.forEach((value, name) => {
            try {
                const clonedValue = this.cloneValue(value);
                captured[name] = this.dataMasker.mask(clonedValue);
            } catch (error) {
                captured[name] = '<error capturing value>';
            }
        });

        return captured;
    }

    /**
     * Clone value (handles circular references)
     */
    private cloneValue(value: any, depth: number = 0, visited = new WeakSet()): any {
        const maxDepth = 5;

        if (depth > maxDepth) {
            return '<max depth reached>';
        }

        if (value === null || value === undefined) {
            return value;
        }

        const type = typeof value;

        if (type === 'string' || type === 'number' || type === 'boolean') {
            return value;
        }

        if (type === 'function') {
            return '<function>';
        }

        if (type === 'symbol') {
            return '<symbol>';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (value instanceof RegExp) {
            return value.toString();
        }

        if (value instanceof Error) {
            return {
                name: value.name,
                message: value.message,
                stack: value.stack,
            };
        }

        // Handle circular references
        if (typeof value === 'object') {
            if (visited.has(value)) {
                return '<circular reference>';
            }
            visited.add(value);

            if (Array.isArray(value)) {
                return value.map((item) => this.cloneValue(item, depth + 1, visited));
            }

            const cloned: any = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    cloned[key] = this.cloneValue(value[key], depth + 1, visited);
                }
            }
            return cloned;
        }

        return '<unknown type>';
    }

    /**
     * Measure event loop lag (simplified measurement)
     */
    private measureEventLoopLag(): number {
        // This is a simplified measurement
        // In production, you'd use more sophisticated methods
        const start = process.hrtime.bigint();
        setImmediate(() => {
            const end = process.hrtime.bigint();
            const lag = Number(end - start) / 1_000_000; // Convert to ms
            return lag;
        });
        return 0; // Placeholder, actual measurement is async
    }

    /**
     * Get all watched variable names
     */
    public getWatchedVariables(): string[] {
        return Array.from(this.watchedVariables.keys());
    }

    /**
     * Clear all watches
     */
    public clearWatches(): void {
        this.watchedVariables.clear();
    }
}
