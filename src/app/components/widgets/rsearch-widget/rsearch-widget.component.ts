import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IWidget } from '../IWidget';
import { Router } from '@angular/router';
// import { SearchGridCallComponent } from '@app/components/search-grid-call/search-grid-call.component';
import { Widget, WidgetArrayInstance } from '@app/helpers/widget';
import { ConstValue, UserConstValue } from '@app/models';
import { SearchService } from '@app/services';
import { Functions, setStorage } from '@app/helpers/functions';
import { TranslateService } from '@ngx-translate/core'
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
  subCategory: 'Other',
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
  limit = 100;
  searchQueryLoki: any;
  queryText: string;
  constructor(
    public dialog: MatDialog,
    public translateService: TranslateService,
    private router: Router,
    private searchService: SearchService
  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
  }

  ngOnInit() {
    WidgetArrayInstance[this.id] = this as IWidget;
    const data = Functions.JSON_parse(localStorage.getItem(UserConstValue.SEARCH_QUERY_LOKI)) ||
      Functions.JSON_parse(localStorage.getItem(ConstValue.SEARCH_QUERY_LOKI));
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
  }
  doSearchResult() {
    this.searchService.setLocalStorageQuery(this.searchQueryLoki);
    // setStorage(ConstValue.SEARCH_QUERY, this.searchQueryLoki);
    this.router.navigate(['search/result']);

  }
  onChangeField(event: any) {

  }
  handleEnterKeyPress(event) {
    const tagName = event.target.tagName.toLowerCase();

    if (tagName !== 'textarea') {
      setTimeout(this.doSearchResult.bind(this), 100);
    }
    return false;

  }
  onClearFields() {
    this.lokiQuery = '';
    this.limit = 100;
  }
  openDialog(): void {
  }

  ngOnDestroy() { }
}
