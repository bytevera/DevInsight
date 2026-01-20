import { CallSite } from '../types';

/**
 * StackTraceParser
 * 
 * Parses and formats V8 stack traces.
 */
export class StackTraceParser {
    /**
     * Parse Error stack into structured CallSite array
     */
    public static parse(error: Error): CallSite[] {
        const stack = error.stack || '';
        const lines = stack.split('\n').slice(1); // Skip error message

        return lines
            .map((line) => this.parseLine(line))
            .filter((callSite): callSite is CallSite => callSite !== null);
    }

    /**
     * Parse single stack trace line
     */
    private static parseLine(line: string): CallSite | null {
        // V8 format: "at functionName (file:line:column)"
        const withParens = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
        if (withParens) {
            return {
                functionName: withParens[1],
                fileName: withParens[2],
                lineNumber: parseInt(withParens[3], 10),
                columnNumber: parseInt(withParens[4], 10),
                isNative: withParens[2].includes('native'),
            };
        }

        // Simpler format: "at file:line:column"
        const simple = line.match(/at\s+(.+):(\d+):(\d+)/);
        if (simple) {
            return {
                fileName: simple[1],
                lineNumber: parseInt(simple[2], 10),
                columnNumber: parseInt(simple[3], 10),
                isNative: simple[1].includes('native'),
            };
        }

        // Native code
        if (line.includes('native')) {
            return {
                functionName: line.trim(),
                isNative: true,
            };
        }

        return null;
    }

    /**
     * Format CallSite array as readable string
     */
    public static format(callSites: CallSite[]): string {
        return callSites
            .map((site) => {
                if (site.isNative) {
                    return `  at ${site.functionName} (native)`;
                }

                const func = site.functionName || '<anonymous>';
                if (site.fileName) {
                    return `  at ${func} (${site.fileName}:${site.lineNumber}:${site.columnNumber})`;
                }

                return `  at ${func}`;
            })
            .join('\n');
    }

    /**
     * Get clean stack trace (remove internal DevInsight frames)
     */
    public static getCleanStack(error: Error): CallSite[] {
        const parsed = this.parse(error);

        return parsed.filter((site) => {
            if (!site.fileName) return true;

            // Filter out DevInsight internal frames
            return (
                !site.fileName.includes('DevInsight') &&
                !site.fileName.includes('node_modules/devinsight')
            );
        });
    }
}
