import { WidgetModel } from './widget.model';

export interface UserSettings {
    guid?: string;
    username: string;
    partid: number;
    category: string;
    param: string;
    data: {
        id: string;
        name: string;
        alias: string;
        selectedItem: string;
        title: string;
        weight: number;
        widgets: Array<WidgetModel>;
        config: {
            margins: Array<number>;
            columns: string;
            pushing: boolean;
            draggable: {
                handle: string;
            };
            resizable: {
                enabled: boolean;
                handles: Array<string>;
            }
        }
    }
}
