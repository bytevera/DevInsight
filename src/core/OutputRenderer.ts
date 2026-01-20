import chalk from 'chalk';
import { OutputData, Breadcrumb } from '../types';

/**
 * OutputRenderer
 * 
 * Formats and renders insights in different output formats (CLI, JSON).
 */
export class OutputRenderer {
    /**
     * Render output data
     */
    public render(data: OutputData): OutputData {
        if (data.format === 'json') {
            data.rendered = this.renderJSON(data);
        } else {
            data.rendered = this.renderCLI(data);
        }

        return data;
    }

    /**
     * Render as CLI-friendly colored output
     */
    private renderCLI(data: OutputData): string {
        const lines: string[] = [];

        // Header
        lines.push('');
        lines.push(chalk.bgRed.white.bold(' DevInsight: Runtime Error Detected '));
        lines.push('');

        // Error info
        lines.push(chalk.red.bold(`${data.context.error.name}: ${data.context.error.message}`));
        lines.push('');

        // Error type
        lines.push(chalk.gray(`Type: ${data.context.type}`));
        lines.push(chalk.gray(`Time: ${new Date(data.context.timestamp).toISOString()}`));
        lines.push(chalk.gray(`Context: ${data.context.contextId}`));
        lines.push('');

        // Likely Causes
        if (data.analysis.likelyCauses.length > 0) {
            lines.push(chalk.yellow.bold('Likely Causes:'));
            data.analysis.likelyCauses.forEach((cause) => {
                const confidence = Math.round(cause.confidence * 100);
                lines.push(
                    `${chalk.yellow('•')} ${cause.description} ${chalk.gray(`(${confidence}% confidence)`)}`
                );
            });
            lines.push('');
        }

        // Suggested Fixes
        if (data.analysis.suggestedFixes.length > 0) {
            lines.push(chalk.green.bold('Suggested Fixes:'));
            data.analysis.suggestedFixes.forEach((fix) => {
                const confidence = Math.round(fix.confidence * 100);
                lines.push(
                    `${chalk.green('✔')} ${fix.description} ${chalk.gray(`(${confidence}% confidence)`)}`
                );
                if (fix.code) {
                    lines.push(chalk.gray(`   ${fix.code}`));
                }
            });
            lines.push('');
        }

        // Async Breadcrumbs
        if (data.context.breadcrumbs.length > 0) {
            lines.push(chalk.cyan.bold('Async Execution Trail:'));
            lines.push(this.renderBreadcrumbs(data.context.breadcrumbs));
            lines.push('');
        }

        // Stack Trace (abbreviated)
        lines.push(chalk.gray.bold('Stack Trace:'));
        const stackLines = data.context.error.stack?.split('\n').slice(0, 6) || [];
        stackLines.forEach((line) => {
            lines.push(chalk.gray(`  ${line}`));
        });
        lines.push('');

        // Runtime State
        lines.push(chalk.magenta.bold('Runtime State:'));
        const mem = data.context.snapshot.process.memoryUsage;
        lines.push(
            chalk.gray(
                `  Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`
            )
        );
        lines.push(chalk.gray(`  Uptime: ${Math.round(data.context.snapshot.process.uptime)}s`));

        // Watched Variables
        const watchedKeys = Object.keys(data.context.snapshot.watchedVariables);
        if (watchedKeys.length > 0) {
            lines.push(chalk.gray(`  Watched Variables: ${watchedKeys.length}`));
            watchedKeys.slice(0, 3).forEach((key) => {
                const rawValue = data.context.snapshot.watchedVariables[key];
                const stringValue = JSON.stringify(rawValue) || String(rawValue);
                const value = stringValue.slice(0, 50) + (stringValue.length > 50 ? '...' : '');
                lines.push(chalk.gray(`    ${key}: ${value}`));
            });
        }
        lines.push('');

        // Confidence Score
        const overallConfidence = Math.round(data.analysis.confidence * 100);
        lines.push(
            chalk.blue.bold(`Overall Confidence: ${overallConfidence}%`) +
            ' ' +
            this.getConfidenceBar(data.analysis.confidence)
        );
        lines.push('');

        return lines.join('\n');
    }

    /**
     * Render breadcrumbs as tree
     */
    private renderBreadcrumbs(breadcrumbs: Breadcrumb[]): string {
        const lines: string[] = [];
        let indent = 0;

        breadcrumbs.forEach((bc, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const prefix = isLast ? '└─' : '├─';
            const connector = '  '.repeat(indent);

            const typeColor =
                bc.type === 'middleware'
                    ? chalk.blue
                    : bc.type === 'async'
                        ? chalk.cyan
                        : bc.type === 'promise'
                            ? chalk.magenta
                            : chalk.white;

            lines.push(`${connector}${prefix} ${typeColor(bc.name)} ${chalk.gray(`(${bc.type})`)}`);

            // Increase indent for child items
            if (!bc.parentId || bc.parentId !== breadcrumbs[idx - 1]?.id) {
                indent++;
            }
        });

        return lines.join('\n');
    }

    /**
     * Render as JSON
     */
    private renderJSON(data: OutputData): string {
        return JSON.stringify(
            {
                error: {
                    name: data.context.error.name,
                    message: data.context.error.message,
                    stack: data.context.error.stack,
                    type: data.context.type,
                },
                analysis: data.analysis,
                context: {
                    contextId: data.context.contextId,
                    timestamp: data.context.timestamp,
                    breadcrumbs: data.context.breadcrumbs,
                    snapshot: data.context.snapshot,
                },
            },
            null,
            2
        );
    }

    /**
     * Get confidence bar visualization
     */
    private getConfidenceBar(confidence: number): string {
        const bars = Math.round(confidence * 10);
        const filled = '█'.repeat(bars);
        const empty = '░'.repeat(10 - bars);
        return chalk.green(filled) + chalk.gray(empty);
    }
}
