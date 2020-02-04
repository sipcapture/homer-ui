import { IWidgetMetaData, IWidget } from '@app/components/widgets/IWidget';

export const WidgetArray: Array<IWidgetMetaData> = [];
export const WidgetArrayInstance: { [key: string]: IWidget } = {};

export function Widget(metaData: IWidgetMetaData): ClassDecorator {
    return function ( constructor: any ) {
        metaData.componentClass = constructor;
        metaData.enable = true;
        metaData.strongIndex = metaData.className;
        metaData.settingWindow = metaData.settingWindow === null || metaData.settingWindow === undefined ? true : metaData.settingWindow;
        WidgetArray.push(metaData);
    };
}
