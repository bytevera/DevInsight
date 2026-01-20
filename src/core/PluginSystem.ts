import { Plugin, PluginHooks, ErrorContext, StateSnapshot, ErrorAnalysis, OutputData } from '../types';

/**
 * PluginSystem
 * 
 * Manages plugin registration, lifecycle, and hook execution.
 */
export class PluginSystem {
    private plugins: Map<string, Plugin> = new Map();

    /**
     * Register a plugin
     */
    public register(plugin: Plugin): void {
        if (this.plugins.has(plugin.name)) {
            console.warn(`[DevInsight] Plugin "${plugin.name}" is already registered`);
            return;
        }

        this.plugins.set(plugin.name, plugin);
        console.log(`[DevInsight] Plugin registered: ${plugin.name} v${plugin.version}`);
    }

    /**
     * Unregister a plugin
     */
    public unregister(pluginName: string): void {
        if (!this.plugins.has(pluginName)) {
            console.warn(`[DevInsight] Plugin "${pluginName}" is not registered`);
            return;
        }

        this.plugins.delete(pluginName);
        console.log(`[DevInsight] Plugin unregistered: ${pluginName}`);
    }

    /**
     * Execute onError hooks
     */
    public async executeOnError(context: ErrorContext): Promise<void> {
        await this.executeHook('onError', (hooks) => hooks.onError?.(context));
    }

    /**
     * Execute onSnapshot hooks
     */
    public async executeOnSnapshot(snapshot: StateSnapshot): Promise<void> {
        await this.executeHook('onSnapshot', (hooks) => hooks.onSnapshot?.(snapshot));
    }

    /**
     * Execute onAnalysis hooks
     */
    public async executeOnAnalysis(analysis: ErrorAnalysis): Promise<void> {
        await this.executeHook('onAnalysis', (hooks) => hooks.onAnalysis?.(analysis));
    }

    /**
     * Execute onOutput hooks
     */
    public async executeOnOutput(output: OutputData): Promise<OutputData> {
        let modifiedOutput = output;

        for (const [name, plugin] of this.plugins) {
            if (plugin.hooks.onOutput) {
                try {
                    const result = await plugin.hooks.onOutput(modifiedOutput);
                    if (result) {
                        modifiedOutput = result;
                    }
                } catch (error) {
                    console.error(`[DevInsight] Error in plugin "${name}" onOutput hook:`, error);
                }
            }
        }

        return modifiedOutput;
    }

    /**
     * Get all registered plugins
     */
    public getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Execute hook with error handling
     */
    private async executeHook(
        hookName: string,
        executor: (hooks: PluginHooks) => void | Promise<void>
    ): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const [name, plugin] of this.plugins) {
            try {
                const result = executor(plugin.hooks);
                if (result instanceof Promise) {
                    promises.push(
                        result.catch((error) => {
                            console.error(`[DevInsight] Error in plugin "${name}" ${hookName} hook:`, error);
                        })
                    );
                }
            } catch (error) {
                console.error(`[DevInsight] Error in plugin "${name}" ${hookName} hook:`, error);
            }
        }

        await Promise.all(promises);
    }
}
