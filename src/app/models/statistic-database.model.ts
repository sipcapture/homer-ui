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
    last_check: string;
    last_error: string;
    latency_avg: number;
    latency_max: number;
    latency_min: number;
    online: boolean;
}
