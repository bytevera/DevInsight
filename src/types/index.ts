/**
 * DevInsight Configuration
 */
export interface DevInsightConfig {
    /** Operating mode: standard (default), strict (more checks), minimal (less overhead) */
    mode?: 'standard' | 'strict' | 'minimal';

    /** Maximum depth for async breadcrumb tracking (default: 50) */
    asyncDepth?: number;

    /** Variable names to watch for mutations */
    watch?: string[];

    /** Enable AI-powered explanations (requires plugin) */
    ai?: boolean;

    /** Output format */
    output?: 'cli' | 'json';

    /** Sampling rate (0-1), 1.0 = capture everything (default: 1.0) */
    sampling?: number;

    /** Data masking configuration */
    masking?: MaskingConfig;

    /** Enable/disable specific features */
    features?: {
        errorInterception?: boolean;
        asyncTracking?: boolean;
        variableWatching?: boolean;
        performanceMonitoring?: boolean;
    };
}

export interface MaskingConfig {
    /** Enable masking (default: true) */
    enabled?: boolean;

    /** Patterns to mask (default: common sensitive keys) */
    patterns?: string[];

    /** Replacement string (default: '***MASKED***') */
    replacement?: string;
}

export interface WatchOptions {
    /** Deep watch nested properties */
    deep?: boolean;

    /** Callback on mutation */
    onMutation?: (mutation: VariableMutation) => void;
}

export interface VariableMutation {
    variableName: string;
    oldValue: any;
    newValue: any;
    oldType: string;
    newType: string;
    stackTrace: string;
    timestamp: number;
}

/**
 * Plugin System
 */
export interface Plugin {
    /** Plugin name */
    name: string;

    /** Plugin version */
    version: string;

    /** Plugin hooks */
    hooks: PluginHooks;
}

export interface PluginHooks {
    /** Called when an error is intercepted */
    onError?: (context: ErrorContext) => void | Promise<void>;

    /** Called when a state snapshot is captured */
    onSnapshot?: (snapshot: StateSnapshot) => void | Promise<void>;

    /** Called after reasoning analysis */
    onAnalysis?: (analysis: ErrorAnalysis) => void | Promise<void>;

    /** Called before rendering output */
    onOutput?: (output: OutputData) => OutputData | Promise<OutputData>;
}

/**
 * Error Context
 */
export interface ErrorContext {
    /** The error object */
    error: Error;

    /** Error type */
    type: 'uncaughtException' | 'unhandledRejection' | 'custom';

    /** Async breadcrumb trail */
    breadcrumbs: Breadcrumb[];

    /** State snapshot at error time */
    snapshot: StateSnapshot;

    /** Stack trace */
    stackTrace: CallSite[];

    /** Timestamp */
    timestamp: number;

    /** Execution context ID */
    contextId: string;
}

export interface Breadcrumb {
    /** Function/operation name */
    name: string;

    /** Function type */
    type: 'function' | 'middleware' | 'promise' | 'async' | 'timer';

    /** Arguments (masked) */
    args?: any[];

    /** Timestamp */
    timestamp: number;

    /** Duration in ms */
    duration?: number;

    /** Parent breadcrumb ID */
    parentId?: string;

    /** Breadcrumb ID */
    id: string;
}

export interface CallSite {
    /** Function name */
    functionName?: string;

    /** File name */
    fileName?: string;

    /** Line number */
    lineNumber?: number;

    /** Column number */
    columnNumber?: number;

    /** Is native */
    isNative?: boolean;
}

export interface StateSnapshot {
    /** Watched variables */
    watchedVariables: Record<string, any>;

    /** Local variables (limited scope) */
    localVariables?: Record<string, any>;

    /** Process info */
    process: {
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
        uptime: number;
    };

    /** Event loop lag */
    eventLoopLag?: number;

    /** Timestamp */
    timestamp: number;
}

/**
 * Error Analysis
 */
export interface ErrorAnalysis {
    /** Probable root causes */
    likelyCauses: Cause[];

    /** Suggested fixes */
    suggestedFixes: Fix[];

    /** Overall confidence (0-1) */
    confidence: number;

    /** Error pattern matched */
    pattern?: string;

    /** AI-generated plain English explanation */
    aiExplanation?: string;

    /** Prevention tips from AI */
    preventionTips?: string[];

    /** Number of similar errors seen before */
    similarErrorsCount?: number;
}

export interface Cause {
    /** Description of the cause */
    description: string;

    /** Confidence (0-1) */
    confidence: number;

    /** Related code location */
    location?: CallSite;
}

export interface Fix {
    /** Fix description */
    description: string;

    /** Confidence (0-1) */
    confidence: number;

    /** Code snippet (if applicable) */
    code?: string;

    /** Fix type */
    type: 'add-check' | 'add-await' | 'type-fix' | 'refactor' | 'install' | 'check' | 'other';
}

/**
 * Output Data
 */
export interface OutputData {
    /** Error context */
    context: ErrorContext;

    /** Analysis */
    analysis: ErrorAnalysis;

    /** Format */
    format: 'cli' | 'json';

    /** Rendered output */
    rendered?: string;
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
    /** Total overhead in ms */
    overhead: number;

    /** Number of tracked contexts */
    trackedContexts: number;

    /** Sampling rate */
    samplingRate: number;

    /** Memory usage by DevInsight */
    memoryUsage: number;
}
