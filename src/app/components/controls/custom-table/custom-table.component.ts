import { Component, OnInit, AfterContentInit, ViewChild, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Functions } from '@app/helpers/functions';

@Component({
    selector: 'app-custom-table',
    templateUrl: './custom-table.component.html',
    styleUrls: ['./custom-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomTableComponent implements AfterViewInit {
    @Input() columns = [];
    @Input() columnsFilter = [];

    @Output() rowClick: EventEmitter<any> = new EventEmitter();
    @Output() rowDblClick: EventEmitter<any> = new EventEmitter();
    @ViewChild(MatSort, { static: false }) sort: MatSort;
    @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

    dataSource = new MatTableDataSource([]);
    tableFilters = [];
    _details: any;
    @Input() isPaginator = true;
    @Input()
    set details(val) {
        this._details = val;
    }
    constructor(private cdr: ChangeDetectorRef) { }

    ngAfterViewInit() {
        this.dataSource = new MatTableDataSource();
        if (this.isPaginator) {
            this.dataSource.paginator = this.paginator;
        }
        this.dataSource.sort = this.sort;
        this.dataSource.data = this._details;
        this.dataSource.filterPredicate = (data: any, filtersJson: string) => {
            const matchFilter = [];
            const filters = Functions.JSON_parse(filtersJson);

            filters.forEach(filter => {
                const value = data[filter.id] === null ? '' : data[filter.id] + '';
                matchFilter.push(value.toLowerCase().includes((filter.value + '').toLowerCase()));
            });
            return matchFilter.every(Boolean);
        };
        this.cdr.detectChanges();
    }

    onRowClick(row, indexItem, event) {
        this.rowClick.emit({ row, indexItem, event });
    }
    onRowDblClick(row, indexItem, event) {
        this.rowDblClick.emit({ row, indexItem, event });
    }
    checkFilterColumn(columnName: string): boolean {
        return !!this.columnsFilter.includes(columnName);
    }
    applyFilter(filterValue: string, columnId: string): void {
        const itemFilter = this.tableFilters.find(i => i.id === columnId);
        if (itemFilter) {
            itemFilter.value = filterValue;
        } else {
            this.tableFilters.push({
                id: columnId,
                value: filterValue + ''
            });
        }
        this.tableFilters = this.tableFilters.filter(i => !!i.value);
        this.dataSource.filter = JSON.stringify(this.tableFilters);
        if (this.isPaginator && this.dataSource.paginator) {
            this.dataSource?.paginator?.firstPage();
        }
        this.cdr.detectChanges();
    }
}
