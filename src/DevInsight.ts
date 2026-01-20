import { DevInsightConfig, WatchOptions, Plugin } from './types';
import { RuntimeHookEngine } from './core/RuntimeHookEngine';
import { ErrorInterceptor } from './core/ErrorInterceptor';
import { StateSnapshotManager } from './core/StateSnapshotManager';
import { ReasoningEngine } from './core/ReasoningEngine';
import { OutputRenderer } from './core/OutputRenderer';
import { PluginSystem } from './core/PluginSystem';
import { PerformanceMonitor } from './utils/PerformanceMonitor';

/**
 * DevInsight
 * 
 * Main orchestrator class for the DevInsight runtime debugging engine.
 * Provides zero-config initialization and intelligent error tracking.
 */
export class DevInsight {
    private static instance: DevInsight | null = null;
    private config: DevInsightConfig;
    private runtimeHooks: RuntimeHookEngine;
    private errorInterceptor: ErrorInterceptor;
    private snapshotManager: StateSnapshotManager;
    private reasoningEngine: ReasoningEngine;
    private outputRenderer: OutputRenderer;
    private pluginSystem: PluginSystem;
    private performanceMonitor: PerformanceMonitor;
    private isEnabled = false;

    private constructor(config: DevInsightConfig) {
        this.config = this.normalizeConfig(config);

        // Initialize components
        this.runtimeHooks = new RuntimeHookEngine(this.config);
        this.snapshotManager = new StateSnapshotManager(this.config);
        this.reasoningEngine = new ReasoningEngine();
        this.outputRenderer = new OutputRenderer();
        this.pluginSystem = new PluginSystem();
        this.performanceMonitor = new PerformanceMonitor();

        this.errorInterceptor = new ErrorInterceptor(
            this.config,
            this.runtimeHooks,
            this.snapshotManager,
            this.reasoningEngine,
            this.outputRenderer
        );
    }

    /**
     * Enable DevInsight with optional configuration
     */
    public static enable(config: DevInsightConfig = {}): DevInsight {
        if (DevInsight.instance) {
            console.warn('[DevInsight] Already enabled. Call disable() first to reconfigure.');
            return DevInsight.instance;
        }

        DevInsight.instance = new DevInsight(config);
        DevInsight.instance.start();

        return DevInsight.instance;
    }

    /**
     * Disable DevInsight
     */
    public static disable(): void {
        if (!DevInsight.instance) {
            console.warn('[DevInsight] Not enabled.');
            return;
        }

        DevInsight.instance.stop();
        DevInsight.instance = null;
    }

    /**
     * Watch a variable for mutations
     */
    public static watch(variableName: string, value: any, _options?: WatchOptions): void {
        if (!DevInsight.instance) {
            throw new Error('[DevInsight] Not enabled. Call DevInsight.enable() first.');
        }

        DevInsight.instance.snapshotManager.watch(variableName, value);
    }

    /**
     * Update watched variable
     */
    public static updateWatch(variableName: string, newValue: any): void {
        if (!DevInsight.instance) {
            throw new Error('[DevInsight] Not enabled. Call DevInsight.enable() first.');
        }

        DevInsight.instance.snapshotManager.updateWatch(variableName, newValue);
    }

    /**
     * Unwatch a variable
     */
    public static unwatch(variableName: string): void {
        if (!DevInsight.instance) {
            throw new Error('[DevInsight] Not enabled. Call DevInsight.enable() first.');
        }

        DevInsight.instance.snapshotManager.unwatch(variableName);
    }

    /**
     * Register a plugin
     */
    public static registerPlugin(plugin: Plugin): void {
        if (!DevInsight.instance) {
            throw new Error('[DevInsight] Not enabled. Call DevInsight.enable() first.');
        }

        DevInsight.instance.pluginSystem.register(plugin);
    }

    /**
     * Track a manual error
     */
    public static trackError(error: Error): void {
        if (!DevInsight.instance) {
            throw new Error('[DevInsight] Not enabled. Call DevInsight.enable() first.');
        }

        DevInsight.instance.errorInterceptor.trackError(error);
    }

    /**
     * Express error handler middleware
     */
    public static expressErrorHandler(): any {
        return (err: any, _req: any, _res: any, next: any) => {
            if (err instanceof Error) {
                DevInsight.trackError(err);
            } else if (err) {
                DevInsight.trackError(new Error(String(err)));
            }
            next(err);
        };
    }

    /**
     * Get current instance (for advanced usage)
     */
    public static getInstance(): DevInsight | null {
        return DevInsight.instance;
    }

    /**
     * Get performance metrics
     */
    public static getMetrics() {
        if (!DevInsight.instance) {
            throw new Error('[DevInsight] Not enabled. Call DevInsight.enable() first.');
        }

        return {
            performance: DevInsight.instance.performanceMonitor.getMetrics(),
            runtime: DevInsight.instance.runtimeHooks.getMetrics(),
        };
    }

    /**
     * Get AI statistics
     */
    public static getAIStats() {
        if (!DevInsight.instance) {
            throw new Error('[DevInsight] Not enabled. Call DevInsight.enable() first.');
        }

        // Access private property strictly for internal use if needed,
        // or exposed via public accessor on ReasoningEngine if available.
        // Since we didn't expose it on ReasoningEngine yet, we might need to cast or just rely on runtime
        // But better: let's expose it in ReasoningEngine first.
        return DevInsight.instance.reasoningEngine.getAIStats();
    }

    /**
     * Start DevInsight
     */
    private start(): void {
        if (this.isEnabled) {
            return;
        }

        console.log('[DevInsight] Starting runtime intelligence engine...');

        // Initialize components
        this.runtimeHooks.initialize();
        this.errorInterceptor.install();

        // Auto-watch configured variables
        if (this.config.watch && this.config.watch.length > 0) {
            console.log(`[DevInsight] Watching ${this.config.watch.length} variables`);
            this.config.watch.forEach(variableName => {
                this.snapshotManager.watch(variableName, undefined);
            });
        }

        this.isEnabled = true;
        console.log('[DevInsight] ✓ Runtime intelligence enabled');
        console.log(`[DevInsight] Mode: ${this.config.mode || 'standard'}`);
        console.log(`[DevInsight] Sampling: ${(this.config.sampling || 1.0) * 100}%`);
    }

    /**
     * Stop DevInsight
     */
    private stop(): void {
        if (!this.isEnabled) {
            return;
        }

        console.log('[DevInsight] Shutting down...');

        this.errorInterceptor.uninstall();
        this.runtimeHooks.shutdown();
        this.snapshotManager.clearWatches();

        this.isEnabled = false;
        console.log('[DevInsight] ✓ Shutdown complete');
    }

    /**
     * Normalize configuration with defaults
     */
    private normalizeConfig(config: DevInsightConfig): DevInsightConfig {
        return {
            mode: config.mode || 'standard',
            asyncDepth: config.asyncDepth || 50,
            watch: config.watch || [],
            ai: config.ai || false,
            output: config.output || 'cli',
            sampling: config.sampling !== undefined ? config.sampling : 1.0,
            masking: {
                enabled: config.masking?.enabled !== false,
                patterns: config.masking?.patterns,
                replacement: config.masking?.replacement,
            },
            features: {
                errorInterception: config.features?.errorInterception !== false,
                asyncTracking: config.features?.asyncTracking !== false,
                variableWatching: config.features?.variableWatching !== false,
                performanceMonitoring: config.features?.performanceMonitoring !== false,
            },
        };
    }
}
