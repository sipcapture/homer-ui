export interface PreferenceAlias {
    id?: number;
    alias: string;
    ip: string;    
    guid?: string;
    port: number;
    mask: number;
    captureID: string;
    status: boolean;
    token?: string;
}
