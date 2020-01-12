import { IWidgetMetaData, IWidget } from '@app/components/widgets/IWidget';

export const WidgetArray: Array<IWidgetMetaData> = [];
export const WidgetArrayInstance = {};

export function Widget(metaData: IWidgetMetaData): ClassDecorator {
    if (WidgetArray.length === 0) {
        console.groupCollapsed(`%cWidget::registred`, `color: lightgreen; font-weight: bold`);
    }

    return function ( constructor: any ) {
        metaData.componentClass = constructor;
        metaData.enable = true;
        metaData.strongIndex = constructor.name;
        metaData.settingWindow = metaData.settingWindow === null || metaData.settingWindow === undefined ? true : metaData.settingWindow;
        WidgetArray.push(metaData);
        // metaData.indexName = metaData.indexName || constructor.name;

        console.log(`%cWidget::registred: %c${metaData.title}`,
            `color: lightgreen; font-weight: bold`,
            `color: lightblue; font-weight: bold; font-style: italic;`,
            {metaData});

        const original = constructor.prototype.ngOnInit;

        constructor.prototype.ngOnInit = function ( ...args ) {
            console.groupEnd();
            if (original) {
                WidgetArrayInstance[this.id] = this;
                original.apply(this, args);
            }
        };
    };
}
