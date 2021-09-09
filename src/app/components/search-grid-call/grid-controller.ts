import { ColDef } from 'ag-grid-community';
import { Input, Component } from '@angular/core';
import { Functions, getStorage, setStorage } from '@app/helpers/functions';
import { ConstValue, UserConstValue } from './../../models/const-value.model';

@Component({
    template: ''
})
export class GridController {
    agGridSizeControl;
    gridColumnApi;

    gridOptions;
    _interval;
    inChartContainer;
    gridApi;

    _columnDefs: Array<ColDef>;
    set columnDefs(value: Array<ColDef>) {
        this._columnDefs = value;
    }
    get columnDefs(): Array<ColDef> {
        return this._columnDefs;
    }

    _id;
    @Input() set id(val: string) {
        this._id = val;
    }
    get id(): string {
        return this._id;
    }
    localData;

    constructor() { }

    public recoverAgGridSizeControl() {
        /** recover agGridSizeControl settings from localStorage */
        const { selectedType, sizeColumnsToFit, pageSize } =
            getStorage(UserConstValue.RESULT_GRID_SETTING) ||
            getStorage(ConstValue.RESULT_GRID_SETTING) || {};

        if (!selectedType && sizeColumnsToFit) {
            Object.keys(this.agGridSizeControl).forEach(option => {
                if (option !== 'pageSize' && option !== 'selectedType' && this.agGridSizeControl[option]) {
                    this.agGridSizeControl.selectedType = option;
                }
            });
            setStorage(UserConstValue.RESULT_GRID_SETTING, this.agGridSizeControl);
        } else {
            this.agGridSizeControl.selectedType = selectedType || 'sizeToFit';
        }
        this.agGridSizeControl.pageSize = pageSize || 100;
        this.updateAgGridSizing();
    }
    public applySavedState() {
        const id = (this.id ? `-${this.id}` : '') + `-${this.localData?.protocol_id}`;
        const lsIndex = ConstValue.RESULT_STATE + id;
        const lsIndexUser = UserConstValue.RESULT_STATE + id;

        let columnState = getStorage(lsIndexUser) || getStorage(lsIndex);
        if (columnState) {
            columnState = columnState.map(column =>
                column = {
                    aggFunc: undefined,
                    colId: column.colId,
                    flex: undefined,
                    hide: column.hide,
                    pinned: undefined,
                    pivot: undefined,
                    pivotIndex: undefined,
                    rowGroup: false,
                    rowGroupIndex: undefined,
                    sort: column.sort,
                    sortIndex: null,
                    width: undefined,
                }
            );
            // per AG-grid specs undefined as a parameter for attribute means "do not apply this attribute"
            // https://www.ag-grid.com/documentation/angular/column-state/#null-vs-undefined
            this.gridColumnApi?.applyColumnState({
                state: columnState,
                applyOrder: true
            });
        }
    }
    public updateAgGridSizing() {
        if (this.agGridSizeControl.selectedType === 'sizeToFitContinuos' || this.agGridSizeControl.selectedType === 'sizeToFit') {
            this.columnDefs?.forEach(column => {
                column.resizable = true;
            });
            this.sizeToFit();
            this.gridOptions?.api?.setColumnDefs(this.columnDefs);
        } else {
            this.columnDefs?.forEach(column => {
                column.resizable = true;
            });
            this.gridOptions?.api?.setColumnDefs(this.columnDefs);
        }
        if (this.agGridSizeControl.selectedType === 'sizeColumnsToFit') {
            setTimeout(() => {
                this.autoSizeAll(true);
            }, 300);
        }
        this.applySavedState();
    }
    public sizeToFit() {
        if (this.inChartContainer || (this.agGridSizeControl.selectedType !== 'sizeToFitContinuos' && this.agGridSizeControl.selectedType !== 'sizeToFit')) {
            return;
        }
        if (this._interval) {
            clearInterval(this._interval);
        }
        this._interval = setTimeout(() => {
            if (this.gridApi && (this.agGridSizeControl.selectedType === 'sizeToFitContinuos' || this.agGridSizeControl.selectedType === 'sizeToFit')) {
                this.gridApi.sizeColumnsToFit();
            }
        }, 100);
    }

    public autoSizeAll(skipHeader) {
        if (!this.gridColumnApi) {
            return;
        }
        const allColumnIds = [];
        this.gridColumnApi.getAllColumns().forEach(({ colId }) => {
            allColumnIds.push(colId);
        });
        this.gridColumnApi.autoSizeColumns(allColumnIds, skipHeader);
    }
}
