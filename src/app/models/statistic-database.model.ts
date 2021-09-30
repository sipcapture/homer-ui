export interface StatsDb {
    database_name: string;
    database_version: string;
    db_stats: {
        idle: number;
        inUse: number;
        maxIdleClosed: number;
        maxOpenConnections: number;
        openConnections: number;
        waitCount: number;
        waitDuration: number;
    };
    db_error_count: number;
    db_error_log: Array<{
        critical: boolean;
        error: string;
        time: string;
    }> | null;
    last_check: string;
    last_error: string;
    latency_avg: number;
    latency_max: number;
    latency_min: number;
    online: boolean;
}
