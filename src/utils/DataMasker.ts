import { MaskingConfig } from '../types';

/**
 * DataMasker
 * 
 * Masks sensitive data in snapshots and logs.
 */
export class DataMasker {
    private config: MaskingConfig;
    private sensitivePatterns: RegExp[];

    constructor(config?: MaskingConfig) {
        this.config = {
            enabled: config?.enabled !== false,
            patterns: config?.patterns || this.getDefaultPatterns(),
            replacement: config?.replacement || '***MASKED***',
        };

        this.sensitivePatterns = this.config.patterns!.map(
            (pattern) => new RegExp(pattern, 'i')
        );
    }

    /**
     * Mask sensitive data in an object
     */
    public mask(value: any): any {
        if (!this.config.enabled) {
            return value;
        }

        return this.maskValue(value);
    }

    private maskValue(value: any, visited = new WeakSet()): any {
        if (value === null || value === undefined) {
            return value;
        }

        const type = typeof value;

        if (type === 'string' || type === 'number' || type === 'boolean') {
            return value;
        }

        if (type === 'object') {
            if (visited.has(value)) {
                return '<circular>';
            }
            visited.add(value);

            if (Array.isArray(value)) {
                return value.map((item) => this.maskValue(item, visited));
            }

            const masked: any = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    if (this.isSensitiveKey(key)) {
                        masked[key] = this.config.replacement;
                    } else {
                        masked[key] = this.maskValue(value[key], visited);
                    }
                }
            }
            return masked;
        }

        return value;
    }

    private isSensitiveKey(key: string): boolean {
        return this.sensitivePatterns.some((pattern) => pattern.test(key));
    }

    private getDefaultPatterns(): string[] {
        return [
            'password',
            'passwd',
            'pwd',
            'secret',
            'token',
            'api[_-]?key',
            'apikey',
            'access[_-]?token',
            'auth',
            'authorization',
            'bearer',
            'credit[_-]?card',
            'card[_-]?number',
            'cvv',
            'ssn',
            'social[_-]?security',
        ];
    }
}
