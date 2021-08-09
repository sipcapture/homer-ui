import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import {
    IAfterGuiAttachedParams,
    IDoesFilterPassParams,
    IFilterParams,
    RowNode,
} from '@ag-grid-community/all-modules';
import { IFilterAngularComp } from '@ag-grid-community/angular';
import { PreferenceMappingProtocolService } from '@app/services';
import { Functions } from '@app/helpers/functions';
import { ConstValue, UserConstValue } from '@app/models';

@Component({
    selector: 'app-status-filter',
    templateUrl: 'status-filter.component.html',
    styleUrls: ['status-filter.component.scss']
})
export class StatusFilterComponent implements IFilterAngularComp {
    private params: IFilterParams;
    private valueGetter: (rowNode: RowNode) => any;
    public text = '';
    private statusMapping;

    @ViewChild('input', { read: ViewContainerRef }) public input;
    constructor(
        private _pmps: PreferenceMappingProtocolService) {
    }
    async agInit(params: IFilterParams) {
        const mappings: Array<any> = await this._pmps.getMerged().toPromise();
        const ls = Functions.JSON_parse(localStorage.getItem(UserConstValue.SEARCH_QUERY)) ||
            Functions.JSON_parse(localStorage.getItem(ConstValue.SEARCH_QUERY));

        const { fields_mapping } = mappings.find(({ hepid, profile }) =>
                `${hepid}_${profile}` === (ls?.protocol_id || '60_call_h20')) || {};

        this.statusMapping = fields_mapping.find(field => field.id === 'status').form_default;
        this.params = params;
        this.valueGetter = params.valueGetter;
    }

    isFilterActive(): boolean {
        return this.text != null && this.text !== '';
    }

    doesFilterPass(params: IDoesFilterPassParams): boolean {
        const mappingName = this.statusMapping.find(status => {
            const value = this.text.toLowerCase();
            return status.name.toLowerCase().startsWith(value)
                || status.value === parseInt(this.text, 10);
        });
        if (typeof mappingName !== 'undefined') {
            return mappingName.value === this.valueGetter(params.node);
      }
      return false;
    }

    getModel(): any {
        return { value: this.text };
    }

    setModel(model: any): void {
        this.text = model ? model.value : '';
    }

    afterGuiAttached(params: IAfterGuiAttachedParams): void {
        window.setTimeout(() => this.input.element.nativeElement.focus());
    }

    onChange(newValue): void {
        if (this.text !== newValue) {
            this.text = newValue;
            this.params.filterChangedCallback();
        }
    }
}
