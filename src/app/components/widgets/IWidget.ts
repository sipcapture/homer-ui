import { OnInit, OnDestroy, EventEmitter } from '@angular/core';

export interface IWidget extends OnInit, OnDestroy {
    id: string;
    config?: any;
    changeSettings?: EventEmitter<any>;
    openDialog(): void;
    setConfig?(config: any): void;
    refresh?(): void;
    doSearchResult?(): void;
}

export interface IWidgetMetaData {
    category: string;
    title: string;
    description: string;
    indexName?: string;
    strongIndex?: string;
    advancedName?: string;
    enable?: boolean;
    componentClass?: any;
    settingWindow?: boolean;
    className?: string;
    submit?: boolean;
    minWidth?: number;
    minHeight?:number;
}
