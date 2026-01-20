import { ErrorContext, ErrorAnalysis } from '../types';

/**
 * LocalAI - Simple Built-in AI/ML Engine
 * 
 * Provides intelligent error analysis using:
 * - Pattern matching with confidence scoring
 * - Bayesian-like probability calculations
 * - Knowledge base of common errors
 * - Context-aware suggestions
 */
export class LocalAI {
    private knowledgeBase: ErrorKnowledge[] = [];
    private errorHistory: ErrorHistoryItem[] = [];

    constructor() {
        this.initializeKnowledgeBase();
    }

    /**
     * Enhance analysis with local AI
     */
    public enhance(context: ErrorContext, baseAnalysis: ErrorAnalysis): ErrorAnalysis {
        // Learn from error
        this.learnFromError(context);

        // Find similar errors
        const similarErrors = this.findSimilarErrors(context);

        // Consult knowledge base
        const kbMatch = this.findKnowledgeMatch(context);

        // Generate AI explanation
        const aiExplanation = this.generateExplanation(context, baseAnalysis, similarErrors, kbMatch);

        // Get prevention tips
        let preventionTips = this.getPreventionTips(context);
        if (kbMatch) {
            preventionTips = [...new Set([...preventionTips, ...kbMatch.solutions])];
        }

        // Boost confidence based on knowledge
        const enhancedConfidence = this.calculateEnhancedConfidence(
            baseAnalysis.confidence,
            similarErrors.length,
            !!kbMatch
        );

        return {
            ...baseAnalysis,
            confidence: enhancedConfidence,
            aiExplanation,
            preventionTips,
            similarErrorsCount: similarErrors.length,
        };
    }

    /**
     * Find match in knowledge base
     */
    private findKnowledgeMatch(context: ErrorContext): ErrorKnowledge | undefined {
        const message = context.error.message;
        return this.knowledgeBase.find(kb => kb.pattern.test(message));
    }

    /**
     * Generate plain English explanation
     */
    private generateExplanation(
        context: ErrorContext,
        analysis: ErrorAnalysis,
        similarErrors: ErrorHistoryItem[],
        kbMatch?: ErrorKnowledge
    ): string {
        const parts: string[] = [];

        // What happened
        parts.push(`**What Happened:**`);
        if (kbMatch) {
            parts.push(`This is a known issue category: **${kbMatch.category}**.`);
            parts.push(`Possible causes: ${kbMatch.commonCauses.join(', ')}.`);
        }
        parts.push(this.explainError(context.error));
        parts.push('');

        // Why it happened
        if (analysis.likelyCauses.length > 0) {
            parts.push(`**Most Likely Cause:**`);
            parts.push(analysis.likelyCauses[0].description);
            parts.push('');
        }

        // How to fix
        if (analysis.suggestedFixes.length > 0) {
            parts.push(`**How to Fix It:**`);
            analysis.suggestedFixes.slice(0, 2).forEach((fix, index) => {
                parts.push(`${index + 1}. ${fix.description}`);
                if (fix.code) {
                    parts.push(`   \`${fix.code}\``);
                }
            });
            parts.push('');
        }

        // Learning from history
        if (similarErrors.length > 0) {
            parts.push(`**AI Note:** I've seen ${similarErrors.length} similar error(s) before.`);
            parts.push('');
        }

        return parts.join('\n');
    }

    /**
     * Explain error in plain English
     */
    private explainError(error: Error): string {
        const message = error.message.toLowerCase();

        // Module errors
        if (message.includes('cannot find module')) {
            const moduleName = this.extractModuleName(error.message);
            return `Node.js couldn't find the '${moduleName}' package. This usually means it's not installed.`;
        }

        // Type errors
        if (message.includes('is not a function')) {
            return `You're trying to call something as a function, but it's not actually a function.`;
        }

        if (message.includes('cannot read propert')) {
            return `You're trying to access a property on something that doesn't exist (null or undefined).`;
        }

        // Syntax errors
        if (error.name === 'SyntaxError') {
            return `There's a syntax mistake in your code that prevents it from running.`;
        }

        // Reference errors
        if (error.name === 'ReferenceError') {
            return `You're using a variable or function that hasn't been defined yet.`;
        }

        // Generic
        return `An unexpected error occurred: ${error.message}`;
    }

    /**
     * Extract module name from error message
     */
    private extractModuleName(message: string): string {
        const match = message.match(/Cannot find module '([^']+)'/);
        return match ? match[1] : 'unknown';
    }

    /**
     * Get prevention tips
     */
    private getPreventionTips(context: ErrorContext): string[] {
        const tips: string[] = [];
        const message = context.error.message.toLowerCase();

        if (message.includes('cannot find module')) {
            tips.push('Always run `npm install` after cloning a project');
            tips.push('Add dependencies to package.json before using them');
            tips.push('Check for typos in your require/import statements');
        }

        if (message.includes('cannot read propert')) {
            tips.push('Use optional chaining (?.) for safer property access');
            tips.push('Add null/undefined checks before accessing properties');
            tips.push('Initialize objects before using them');
        }

        if (message.includes('is not a function')) {
            tips.push('Check your import/export statements');
            tips.push('Verify the variable type before calling it');
            tips.push('Make sure you\'re calling methods on the right object');
        }

        if (context.type === 'unhandledRejection') {
            tips.push('Always add .catch() to Promises');
            tips.push('Use try-catch blocks with async/await');
            tips.push('Handle errors in async functions');
        }

        return tips;
    }

    /**
     * Find similar errors from history
     */
    private findSimilarErrors(context: ErrorContext): ErrorHistoryItem[] {
        return this.errorHistory.filter((item) => {
            // Same error name and similar message
            if (item.errorName !== context.error.name) return false;

            const similarity = this.calculateSimilarity(
                item.errorMessage,
                context.error.message
            );

            return similarity > 0.7; // 70% similarity threshold
        });
    }

    /**
     * Calculate string similarity (simple Levenshtein-like)
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);

        const commonWords = words1.filter((word) => words2.includes(word));
        const totalWords = Math.max(words1.length, words2.length);

        return totalWords > 0 ? commonWords.length / totalWords : 0;
    }

    /**
     * Learn from error (store in history)
     */
    private learnFromError(context: ErrorContext): void {
        this.errorHistory.push({
            errorName: context.error.name,
            errorMessage: context.error.message,
            timestamp: context.timestamp,
            type: context.type,
        });

        // Keep only last 100 errors
        if (this.errorHistory.length > 100) {
            this.errorHistory.shift();
        }
    }

    /**
     * Calculate enhanced confidence
     */
    private calculateEnhancedConfidence(
        baseConfidence: number,
        similarErrorsCount: number,
        hasKbMatch: boolean
    ): number {
        let confidence = baseConfidence;

        // Boost from history
        confidence += Math.min(similarErrorsCount * 0.05, 0.15);

        // Boost from knowledge base
        if (hasKbMatch) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Initialize knowledge base with common patterns
     */
    private initializeKnowledgeBase(): void {
        this.knowledgeBase = [
            {
                pattern: /cannot find module/i,
                category: 'dependency',
                commonCauses: [
                    'Package not installed',
                    'Wrong module name',
                    'Missing from package.json',
                ],
                solutions: [
                    'Run npm install <package-name>',
                    'Check spelling of module name',
                    'Verify package.json',
                ],
            },
            {
                pattern: /cannot read propert/i,
                category: 'null-access',
                commonCauses: [
                    'Variable is null or undefined',
                    'Object not initialized',
                    'Async operation not complete',
                ],
                solutions: [
                    'Add null check: if (obj) { ... }',
                    'Use optional chaining: obj?.prop',
                    'Initialize variable before use',
                ],
            },
            {
                pattern: /is not a function/i,
                category: 'type-error',
                commonCauses: [
                    'Wrong import/export',
                    'Variable has wrong type',
                    'Method doesnt exist',
                ],
                solutions: [
                    'Check import statement',
                    'Verify object has the method',
                    'Check type before calling',
                ],
            },
        ];
    }

    /**
     * Get statistics about learned patterns
     */
    public getStats(): {
        totalErrors: number;
        uniqueErrors: number;
        mostCommon: string;
    } {
        const errorCounts = new Map<string, number>();

        this.errorHistory.forEach((item) => {
            const key = `${item.errorName}: ${item.errorMessage}`;
            errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
        });

        let mostCommon = 'None';
        let maxCount = 0;

        errorCounts.forEach((count, error) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = error;
            }
        });

        return {
            totalErrors: this.errorHistory.length,
            uniqueErrors: errorCounts.size,
            mostCommon,
        };
    }
}

/**
 * Knowledge base entry
 */
interface ErrorKnowledge {
    pattern: RegExp;
    category: string;
    commonCauses: string[];
    solutions: string[];
}

/**
 * Error history item
 */
interface ErrorHistoryItem {
    errorName: string;
    errorMessage: string;
    timestamp: number;
    type: string;
}
