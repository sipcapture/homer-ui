export interface DashboardContentModel {
    id?: string;
    cols: number;
    rows: number;
    y: number;
    x: number;
    component?: any;
    name: string;
    title?: string;
    config?: any;
    output?: any;
    strongIndex?: string;
    minItemCols?: number;
    minItemRows?: number;
    isWarning?: boolean;
    isDismissed?: boolean;
}
