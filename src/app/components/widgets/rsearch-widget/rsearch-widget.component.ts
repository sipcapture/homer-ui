import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IWidget } from '../IWidget';
import { Router } from '@angular/router';
import { SearchGridCallComponent } from '@app/components/search-grid-call/search-grid-call.component';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { ConstValue } from '@app/models';
import { SearchService } from '@app/services';

@Component({
    selector: 'app-rsearch-widget',
    templateUrl: './rsearch-widget.component.html',
    styleUrls: ['./rsearch-widget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
@Widget({
    title: 'Loki Search',
    description: 'Display Loki Search Form',
    category: 'Search',
    indexName: 'rsearch',
    settingWindow: false,
    className: 'RsearchWidgetComponent',
    submit: true,
    minHeight: 300,
    minWidth: 300
})
export class RsearchWidgetComponent implements IWidget {
    @Input() id: string;

    lokiQuery: string;
    limit: number;
    searchQueryLoki: any;
    queryText: string;
    constructor(
        public dialog: MatDialog,
        private router: Router,
        private searchService: SearchService,
        private cdr: ChangeDetectorRef
    ) {
    }

    ngOnInit() {
        WidgetArrayInstance[this.id] = this as IWidget;
        const data = JSON.parse(localStorage.getItem(ConstValue.SEARCH_QUERY_LOKI));
        if (data) {
            this.queryText = data.text;
            this.limit = data.limit * 1 || 100;
        }
    }
    onCodeData(event) {
        this.searchQueryLoki = event;
        this.searchQueryLoki.limit = this.limit * 1 || 100;
        this.searchQueryLoki.protocol_id = ConstValue.LOKI_PREFIX;
        this.searchQueryLoki.fields = [];
        this.cdr.detectChanges();
    }
    doSearchResult() {
        this.searchService.setLocalStorageQuery(this.searchQueryLoki);
        // localStorage.setItem(ConstValue.SEARCH_QUERY, JSON.stringify(this.searchQueryLoki));
        this.cdr.detectChanges();
        this.router.navigate(['search/result']);
    }
    onChangeField (event: any) {
        this.cdr.detectChanges();
    }
    handleEnterKeyPress (event) {
        const tagName = event.target.tagName.toLowerCase();

        if (tagName !== 'textarea') {
            setTimeout(this.doSearchResult.bind(this), 100);
            return false;
        }
    }
    onClearFields () {
        this.lokiQuery = '';
        this.limit = 100;
    }
    openDialog(): void {
    }

    ngOnDestroy () { }
}
