import { DashboardContentModel } from './dashboard-content.model';

export interface DashboardModel {
    // id: number;
    // username: string;
    dashboard: Array<DashboardContentModel>;

    category: string;
    create_date: string;
    data: any;
    id: number;
    param: string;
    partid: number;
    username: string;
    widgets?: any;
}