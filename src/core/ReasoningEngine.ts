import { ErrorContext, ErrorAnalysis, Cause, Fix } from '../types';
import { LocalAI } from './LocalAI';

/**
 * ReasoningEngine
 * 
 * Analyzes errors and execution context to determine probable root causes
 * and suggest actionable fixes with confidence scores.
 * Now enhanced with built-in Local AI!
 */
export class ReasoningEngine {
    private errorPatterns: ErrorPattern[] = [];
    private localAI: LocalAI;

    constructor() {
        this.initializePatterns();
        this.localAI = new LocalAI();
    }

    /**
     * Analyze error context and generate insights
     */
    public analyze(context: ErrorContext): ErrorAnalysis {
        const matchedPatterns = this.matchPatterns(context);
        const likelyCauses = this.identifyCauses(context, matchedPatterns);
        const suggestedFixes = this.generateFixes(context, matchedPatterns);

        // Calculate overall confidence
        const confidence =
            likelyCauses.length > 0
                ? likelyCauses.reduce((sum, cause) => sum + cause.confidence, 0) / likelyCauses.length
                : 0;

        const baseAnalysis: ErrorAnalysis = {
            likelyCauses,
            suggestedFixes,
            confidence,
            pattern: matchedPatterns[0]?.name,
        };

        // Enhance with built-in Local AI
        return this.localAI.enhance(context, baseAnalysis);
    }

    /**
     * Get AI statistics
     */
    public getAIStats() {
        return this.localAI.getStats();
    }

    /**
     * Match error patterns
     */
    private matchPatterns(context: ErrorContext): ErrorPattern[] {
        const matched: ErrorPattern[] = [];

        for (const pattern of this.errorPatterns) {
            if (pattern.matcher(context)) {
                matched.push(pattern);
            }
        }

        // Sort by priority
        matched.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        return matched;
    }

    /**
     * Identify probable causes
     */
    private identifyCauses(_context: ErrorContext, patterns: ErrorPattern[]): Cause[] {
        const causes: Cause[] = [];

        // Use matched patterns
        for (const pattern of patterns) {
            if (pattern.causes) {
                causes.push(...pattern.causes);
            }
        }

        // Generic analysis
        if (causes.length === 0) {
            causes.push({
                description: 'Unknown error cause',
                confidence: 0.3,
            });
        }

        return causes;
    }

    /**
     * Generate fix suggestions
     */
    private generateFixes(_context: ErrorContext, patterns: ErrorPattern[]): Fix[] {
        const fixes: Fix[] = [];

        // Use matched patterns
        for (const pattern of patterns) {
            if (pattern.fixes) {
                fixes.push(...pattern.fixes);
            }
        }

        // Sort by confidence
        fixes.sort((a, b) => b.confidence - a.confidence);

        return fixes.slice(0, 5); // Return top 5 fixes
    }

    /**
     * Initialize common error patterns
     */
    private initializePatterns(): void {
        // Pattern: Null/Undefined Access
        this.errorPatterns.push({
            name: 'null-undefined-access',
            priority: 10,
            matcher: (ctx) => {
                return (
                    ctx.error.message.includes('Cannot read property') ||
                    ctx.error.message.includes('Cannot read properties of undefined') ||
                    ctx.error.message.includes('Cannot read properties of null')
                );
            },
            causes: [
                {
                    description: 'Attempting to access property on null or undefined object',
                    confidence: 0.95,
                },
                {
                    description: 'Object was not initialized before use',
                    confidence: 0.8,
                },
            ],
            fixes: [
                {
                    description: 'Add null/undefined check before accessing property',
                    confidence: 0.9,
                    type: 'add-check',
                    code: 'if (obj && obj.property) { ... }',
                },
                {
                    description: 'Use optional chaining',
                    confidence: 0.95,
                    type: 'refactor',
                    code: 'obj?.property',
                },
            ],
        });

        // Pattern: Missing Await
        this.errorPatterns.push({
            name: 'missing-await',
            priority: 9,
            matcher: (ctx) => {
                const hasPromiseInStack = ctx.breadcrumbs.some((bc) => bc.type === 'promise');
                const hasAsyncError =
                    ctx.error.message.includes('Promise') || ctx.error.message.includes('async');
                return hasPromiseInStack && hasAsyncError;
            },
            causes: [
                {
                    description: 'Missing await on Promise',
                    confidence: 0.85,
                },
                {
                    description: 'Async function returned without await',
                    confidence: 0.75,
                },
            ],
            fixes: [
                {
                    description: 'Add await keyword to Promise',
                    confidence: 0.9,
                    type: 'add-await',
                    code: 'await asyncFunction()',
                },
                {
                    description: 'Add .then() handler',
                    confidence: 0.7,
                    type: 'refactor',
                    code: 'asyncFunction().then(result => { ... })',
                },
            ],
        });

        // Pattern: Type Mismatch
        this.errorPatterns.push({
            name: 'type-mismatch',
            priority: 8,
            matcher: (ctx) => {
                return (
                    ctx.error instanceof TypeError &&
                    (ctx.error.message.includes('is not a function') ||
                        ctx.error.message.includes('is not a constructor'))
                );
            },
            causes: [
                {
                    description: 'Variable has unexpected type',
                    confidence: 0.9,
                },
                {
                    description: 'Function called on non-function value',
                    confidence: 0.85,
                },
            ],
            fixes: [
                {
                    description: 'Check type before calling',
                    confidence: 0.85,
                    type: 'add-check',
                    code: 'if (typeof fn === "function") { fn(); }',
                },
                {
                    description: 'Verify import/export statements',
                    confidence: 0.7,
                    type: 'other',
                },
            ],
        });

        // Pattern: Unhandled Rejection
        this.errorPatterns.push({
            name: 'unhandled-rejection',
            priority: 7,
            matcher: (ctx) => {
                return ctx.type === 'unhandledRejection';
            },
            causes: [
                {
                    description: 'Promise rejection was not caught',
                    confidence: 1.0,
                },
            ],
            fixes: [
                {
                    description: 'Add .catch() handler to Promise',
                    confidence: 0.9,
                    type: 'add-check',
                    code: 'promise.catch(err => { ... })',
                },
                {
                    description: 'Wrap in try-catch with await',
                    confidence: 0.85,
                    type: 'add-check',
                    code: 'try { await promise; } catch (err) { ... }',
                },
            ],
        });

        // Pattern: Missing Module/Package
        this.errorPatterns.push({
            name: 'missing-module',
            priority: 10,
            matcher: (ctx) => {
                return (
                    ctx.error.message.includes('Cannot find module') ||
                    ctx.error.message.includes('MODULE_NOT_FOUND') ||
                    ctx.error.message.includes('Error: Cannot resolve module')
                );
            },
            causes: [
                {
                    description: 'Required module is not installed',
                    confidence: 0.95,
                },
                {
                    description: 'Module path is incorrect or misspelled',
                    confidence: 0.85,
                },
                {
                    description: 'Missing dependency in package.json',
                    confidence: 0.9,
                },
            ],
            fixes: [
                {
                    description: 'Install the missing module',
                    confidence: 0.95,
                    type: 'install',
                    code: 'npm install <module-name>',
                },
                {
                    description: 'Check module name spelling in require/import statement',
                    confidence: 0.85,
                    type: 'check',
                },
                {
                    description: 'Verify the module exists in package.json dependencies',
                    confidence: 0.8,
                    type: 'check',
                },
                {
                    description: 'Run npm install to install all dependencies',
                    confidence: 0.9,
                    type: 'install',
                    code: 'npm install',
                },
            ],
        });
    }
}

/**
 * Error pattern definition
 */
interface ErrorPattern {
    name: string;
    priority?: number;
    matcher: (context: ErrorContext) => boolean;
    causes?: Cause[];
    fixes?: Fix[];
}
