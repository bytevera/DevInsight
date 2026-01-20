/**
 * PerformanceMonitor
 * 
 * Tracks DevInsight's performance overhead.
 */
export class PerformanceMonitor {
    private measurements: bigint[] = [];
    private maxMeasurements = 1000;

    /**
     * Start measuring
     */
    public start(): bigint {
        return process.hrtime.bigint();
    }

    /**
     * End measuring and record
     */
    public end(startTime: bigint): number {
        const endTime = process.hrtime.bigint();
        const duration = endTime - startTime;

        this.measurements.push(duration);

        // Keep only recent measurements
        if (this.measurements.length > this.maxMeasurements) {
            this.measurements.shift();
        }

        // Return duration in milliseconds
        return Number(duration) / 1_000_000;
    }

    /**
     * Get average overhead in ms
     */
    public getAverageOverhead(): number {
        if (this.measurements.length === 0) {
            return 0;
        }

        const sum = this.measurements.reduce((acc, val) => acc + val, 0n);
        const avg = Number(sum) / this.measurements.length;

        return avg / 1_000_000; // Convert to ms
    }

    /**
     * Get percentile overhead
     */
    public getPercentile(p: number): number {
        if (this.measurements.length === 0) {
            return 0;
        }

        const sorted = [...this.measurements].sort((a, b) => (a < b ? -1 : 1));
        const index = Math.floor((p / 100) * sorted.length);

        return Number(sorted[index]) / 1_000_000;
    }

    /**
     * Get metrics summary
     */
    public getMetrics(): {
        avg: number;
        p50: number;
        p95: number;
        p99: number;
        count: number;
    } {
        return {
            avg: this.getAverageOverhead(),
            p50: this.getPercentile(50),
            p95: this.getPercentile(95),
            p99: this.getPercentile(99),
            count: this.measurements.length,
        };
    }

    /**
     * Reset measurements
     */
    public reset(): void {
        this.measurements = [];
    }
}
