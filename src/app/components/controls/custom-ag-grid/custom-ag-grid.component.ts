import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Functions } from '@app/helpers/functions';
import { DateFormat } from '@app/services/time-formatting.service';
import { GridOptions } from 'ag-grid-community';
import { SettingButtonComponent } from './setting-button';

@Component({
    selector: 'custom-ag-grid',
    templateUrl: './custom-ag-grid.component.html',
    styleUrls: ['./custom-ag-grid.component.scss']
})
export class CustomAgGridComponent implements OnInit {
    agGridSizeControl = {
        selectedType: 'sizeToFit',
        // pageSize: 100
    };
    agColumnDefs: any[] = [];
    _details = [];
    frameworkComponents: any;
    gridOptions: GridOptions = <GridOptions>{
        defaultColDef: {
            sortable: true,
            resizable: true,
        },
        rowHeight: 38,
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        suppressCellSelection: true,
        suppressPaginationPanel: true
    };
    _columns: any[] = [];
    gridApi: any;
    @Input() dateFormat: DateFormat;
    @Input() customTimeParser: (columnType: string, value: string) => string;
    @Input() set details(val) {
        this._details = Functions.cloneObject(val);
        this.re_new();
    }
    get details() {
        return this._details;
    }
    @Input() set columns(val: string[]) {
        if (!val) {
            return;
        }
        const isDetailsReady = () => {
            if (this.details?.length) {
                const [firstItemOfDetails] = this.details;

                this._columns = Object.entries(firstItemOfDetails)
                    .filter(([key, value]: any) => typeof value !== 'object' || value instanceof Array)
                    .map(([column]: any) => {

                        const aliasFromKey = {
                            'srcAlias_srcPort': 'SRC IP with Port',
                            'dstAlias_dstPort': 'DST IP with Port',
                            'diff': 'Delta',
                            'id': 'ID',
                            'create_date': 'Date',
                            'timeSeconds': 'Timestamp',
                            'ip_tos': 'IP TOS',
                            'Msg_Size': 'Msg. Size',
                        }
                        const dateTimeField = {
                            create_date: 'date',
                            timeSeconds: 'time'
                        }
                        //({ value }) =>
                        // value && moment(value).format(this.dateFormat.dateTimeResults)
                        return {
                            field: column,
                            headerName: aliasFromKey[column] || column,
                            hide: !val.includes(column),
                            valueFormatter: !!dateTimeField[column] && this.customTimeParser ? ({value}) => this.customTimeParser(dateTimeField[column], value) : null
                        }
                    });

                this._columns.push({
                    field: '',
                    headerName: '',
                    headerComponent: 'settings',
                    hide: false,
                    pinned: 'left',
                    lockPinned: true,
                    resizable: false,
                    minWidth: 40,
                    maxWidth: 40
                });
                this.re_new();
            } else {
                setTimeout(() => {
                    isDetailsReady();
                });
            }
        };
        isDetailsReady();
    }
    get columns() {
        return this._columns;
    }
    @Output() rowClick: EventEmitter<any> = new EventEmitter();

    @HostListener('dblclick')
    onDblClick() {
        requestAnimationFrame(() => {
            this.gridApi?.sizeColumnsToFit();
        });
    }

    // @HostListener('window:resize')
    onResize() {
        if (!this.gridApi || this.agGridSizeControl.selectedType !== 'sizeToFit') {
            return;
        }

        requestAnimationFrame(() => {
            if (this.agGridSizeControl.selectedType === 'sizeToFit') {
                this.gridApi?.sizeColumnsToFit();
            }
        });
    }
    onGridReady(params: any) {
        this.gridApi = params.api;
    }
    constructor(private cdr: ChangeDetectorRef) {
        this.frameworkComponents = {
            settings: SettingButtonComponent
        };
    }

    ngOnInit() {
        this.re_new();
    }
    private re_new() {
        this.sizeToFit();
        this.cdr.detectChanges();
    }
    private sizeToFit() {
        setTimeout(() => {
            this.gridOptions.api?.sizeColumnsToFit();
            this.cdr.detectChanges();
        }, 100);
    }

    public getRowStyle(params) {
        const _style: any = {
            'border-bottom': '1px solid rgba(0,0,0,0.1)',
            'cursor': 'pointer'
        }
        if (params.node.rowIndex % 2 === 0) {
            _style.background = '#e4f0ec';
        }
        return _style;
    }
    sortChanged(event) {
        this.cdr.detectChanges();
    }
    cellClicked(event) {
        this.rowClick.emit(event);
    }
    doOpenFilter() {

    }
}
