export interface PreferenceInterception {
    version:number; 
    uuid: string;
    gid: number;
    liid: number;
    search_callee: string;
    search_caller: string;
    search_ip: string;
    delivery: string; // JSON object
    create_date: Date;
    modify_date: Date;
    start_date: Date;
    stop_date: Date;
    description:string;
    status: boolean;
}
