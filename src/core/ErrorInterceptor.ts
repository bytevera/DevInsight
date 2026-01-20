import { RuntimeHookEngine } from './RuntimeHookEngine';
import { StateSnapshotManager } from './StateSnapshotManager';
import { ReasoningEngine } from './ReasoningEngine';
import { OutputRenderer } from './OutputRenderer';
import { ErrorContext, DevInsightConfig } from '../types';

/**
 * ErrorInterceptor
 * 
 * Intercepts uncaught exceptions and unhandled promise rejections.
 * Enriches errors with runtime context, breadcrumbs, and state snapshots.
 */
export class ErrorInterceptor {
    private config: DevInsightConfig;
    private runtimeHooks: RuntimeHookEngine;
    private snapshotManager: StateSnapshotManager;
    private reasoningEngine: ReasoningEngine;
    private outputRenderer: OutputRenderer;
    private originalHandlers: {
        uncaughtException?: (...args: any[]) => void;
        unhandledRejection?: (...args: any[]) => void;
    } = {};

    constructor(
        config: DevInsightConfig,
        runtimeHooks: RuntimeHookEngine,
        snapshotManager: StateSnapshotManager,
        reasoningEngine: ReasoningEngine,
        outputRenderer: OutputRenderer
    ) {
        this.config = config;
        this.runtimeHooks = runtimeHooks;
        this.snapshotManager = snapshotManager;
        this.reasoningEngine = reasoningEngine;
        this.outputRenderer = outputRenderer;
    }

    /**
     * Install error handlers
     */
    public install(): void {
        if (this.config.features?.errorInterception === false) {
            return;
        }

        // Store original handlers
        this.storeOriginalHandlers();

        // Install handlers
        process.on('uncaughtException', this.handleUncaughtException.bind(this));
        process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

        // Custom Error.prepareStackTrace for better stack traces
        this.installStackTraceFormatter();

        console.log('[DevInsight] Error interceptors installed');
    }

    /**
     * Track a manual error
     */
    public trackError(error: Error): void {
        const context = this.buildErrorContext(error, 'custom');
        this.processError(context);
    }

    /**
     * Uninstall error handlers
     */
    public uninstall(): void {
        process.removeListener('uncaughtException', this.handleUncaughtException.bind(this));
        process.removeListener('unhandledRejection', this.handleUnhandledRejection.bind(this));

        // Restore original prepareStackTrace
        if ('prepareStackTrace' in Error) {
            delete (Error as any).prepareStackTrace;
        }

        console.log('[DevInsight] Error interceptors uninstalled');
    }

    private storeOriginalHandlers(): void {
        // Store existing handlers if any
        const existingException = process.listeners('uncaughtException');
        const existingRejection = process.listeners('unhandledRejection');

        if (existingException.length > 0) {
            this.originalHandlers.uncaughtException = existingException[0] as any;
        }
        if (existingRejection.length > 0) {
            this.originalHandlers.unhandledRejection = existingRejection[0] as any;
        }
    }

    private handleUncaughtException(error: Error): void {
        const context = this.buildErrorContext(error, 'uncaughtException');
        this.processError(context);

        // Call original handler if exists
        const originalHandler = this.originalHandlers.uncaughtException;
        if (typeof originalHandler === 'function') {
            originalHandler(error);
        }

        // Exit process (standard behavior)
        process.exit(1);
    }

    private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        const context = this.buildErrorContext(error, 'unhandledRejection');
        this.processError(context);

        // Call original handler if exists
        const originalHandler = this.originalHandlers.unhandledRejection;
        if (typeof originalHandler === 'function') {
            originalHandler(reason, promise);
        }
    }

    private buildErrorContext(
        error: Error,
        type: 'uncaughtException' | 'unhandledRejection' | 'custom'
    ): ErrorContext {
        const currentContext = this.runtimeHooks.getCurrentContext();

        return {
            error,
            type,
            breadcrumbs: this.runtimeHooks.getBreadcrumbs(),
            snapshot: this.snapshotManager.captureSnapshot(),
            stackTrace: this.parseStackTrace(error),
            timestamp: Date.now(),
            contextId: currentContext?.id || 'no-context',
        };
    }

    private parseStackTrace(error: Error): any[] {
        // Parse stack trace into structured format
        const stack = error.stack || '';
        const lines = stack.split('\n').slice(1); // Skip first line (error message)

        return lines.map((line) => {
            // Parse V8 stack trace format
            const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
            if (match) {
                return {
                    functionName: match[1],
                    fileName: match[2],
                    lineNumber: parseInt(match[3], 10),
                    columnNumber: parseInt(match[4], 10),
                    isNative: false,
                };
            }

            // Try simpler format
            const simpleMatch = line.match(/at\s+(.+):(\d+):(\d+)/);
            if (simpleMatch) {
                return {
                    fileName: simpleMatch[1],
                    lineNumber: parseInt(simpleMatch[2], 10),
                    columnNumber: parseInt(simpleMatch[3], 10),
                    isNative: false,
                };
            }

            return { functionName: line.trim(), isNative: line.includes('native') };
        });
    }

    private processError(context: ErrorContext): void {
        // Analyze error
        const analysis = this.reasoningEngine.analyze(context);

        // Render output
        const output = this.outputRenderer.render({
            context,
            analysis,
            format: this.config.output || 'cli',
        });

        // Print to console
        console.error(output.rendered);
    }

    private installStackTraceFormatter(): void {
        // Custom stack trace formatter for cleaner output
        const originalPrepareStackTrace = Error.prepareStackTrace;

        Error.prepareStackTrace = (error: Error, structuredStackTrace: NodeJS.CallSite[]) => {
            // Keep original format but allow customization
            if (originalPrepareStackTrace) {
                return originalPrepareStackTrace(error, structuredStackTrace);
            }

            // Default V8 format
            return (
                error.toString() +
                '\n' +
                structuredStackTrace.map((callSite) => `    at ${callSite.toString()}`).join('\n')
            );
        };
    }
}
