import { AsyncLocalStorage } from 'async_hooks';
import {
    DevInsightConfig,
    Breadcrumb,
    StateSnapshot,
    PerformanceMetrics,
} from '../types';

/**
 * RuntimeHookEngine
 * 
 * Manages async context tracking using AsyncLocalStorage.
 * Provides context creation, propagation, and retrieval across async boundaries.
 */
export class RuntimeHookEngine {
    private asyncLocalStorage: AsyncLocalStorage<ExecutionContext>;
    private config: DevInsightConfig;
    private contextCounter: number = 0;
    private activeContexts: Map<string, ExecutionContext> = new Map();

    constructor(config: DevInsightConfig) {
        this.config = config;
        this.asyncLocalStorage = new AsyncLocalStorage<ExecutionContext>();
    }

    /**
     * Initialize the runtime hooks
     */
    public initialize(): void {
        // Runtime hooks are ready via AsyncLocalStorage
        console.log('[DevInsight] Runtime hooks initialized');
    }

    /**
     * Create a new execution context and run callback within it
     */
    public run<T>(callback: () => T, metadata?: Record<string, any>): T {
        // Check sampling
        if (this.config.sampling && Math.random() > this.config.sampling) {
            // Skip this context
            return callback();
        }

        const contextId = this.generateContextId();
        const context: ExecutionContext = {
            id: contextId,
            startTime: process.hrtime.bigint(),
            breadcrumbs: [],
            metadata: metadata || {},
            parent: this.getCurrentContext(),
        };

        this.activeContexts.set(contextId, context);

        try {
            return this.asyncLocalStorage.run(context, callback);
        } finally {
            // Cleanup after execution
            this.activeContexts.delete(contextId);
        }
    }

    /**
     * Get current execution context
     */
    public getCurrentContext(): ExecutionContext | undefined {
        return this.asyncLocalStorage.getStore();
    }

    /**
     * Add breadcrumb to current context
     */
    public addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'id' | 'parentId'>): void {
        const context = this.getCurrentContext();
        if (!context) return;

        // Check depth limit
        const maxDepth = this.config.asyncDepth || 50;
        if (context.breadcrumbs.length >= maxDepth) {
            return;
        }

        const fullBreadcrumb: Breadcrumb = {
            ...breadcrumb,
            id: this.generateBreadcrumbId(),
            parentId: context.breadcrumbs[context.breadcrumbs.length - 1]?.id,
        };

        context.breadcrumbs.push(fullBreadcrumb);
    }

    /**
     * Get all breadcrumbs from current context
     */
    public getBreadcrumbs(): Breadcrumb[] {
        const context = this.getCurrentContext();
        return context?.breadcrumbs || [];
    }

    /**
     * Capture state snapshot for current context
     */
    public captureSnapshot(watchedVars: Record<string, any>): StateSnapshot {
        return {
            watchedVariables: watchedVars,
            process: {
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                uptime: process.uptime(),
            },
            timestamp: Date.now(),
        };
    }

    /**
     * Get performance metrics
     */
    public getMetrics(): PerformanceMetrics {
        return {
            overhead: 0, // Will be calculated by PerformanceMonitor
            trackedContexts: this.activeContexts.size,
            samplingRate: this.config.sampling || 1.0,
            memoryUsage: process.memoryUsage().heapUsed,
        };
    }

    /**
     * Shutdown and cleanup
     */
    public shutdown(): void {
        this.activeContexts.clear();
        console.log('[DevInsight] Runtime hooks shutdown');
    }

    private generateContextId(): string {
        return `ctx_${++this.contextCounter}_${Date.now()}`;
    }

    private generateBreadcrumbId(): string {
        return `bc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Internal execution context
 */
interface ExecutionContext {
    id: string;
    startTime: bigint;
    breadcrumbs: Breadcrumb[];
    metadata: Record<string, any>;
    parent?: ExecutionContext;
}
