import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import 'brace';
import 'brace/mode/text';
import 'brace/theme/github';

@Component({
    selector: 'app-dialog-mapping',
    templateUrl: './dialog-mapping.component.html',
    styleUrls: ['./dialog-mapping.component.scss']
})
export class DialogMappingComponent {
    constructor(
        public dialogRef: MatDialogRef<DialogMappingComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (data.isnew) {
            data.data = {
                partid: 10,
                hep_alias: '',
                hepid: 10,
                profile: '',
                partition_step: 10,
                retention: 1,
                correlation_mapping: {},
                fields_mapping: {}
            };
        }

        data.data.correlation_mapping = data.isnew ? 
            '{}' :
            (typeof data.data.correlation_mapping === 'string' ?
                data.data.correlation_mapping :
                JSON.stringify(data.data.correlation_mapping, null, 4)
            );
        
        data.data.fields_mapping = data.isnew ? 
            '[]' :
            (typeof data.data.fields_mapping === 'string' ?
                data.data.fields_mapping :
                JSON.stringify(data.data.fields_mapping, null, 4)
            );
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
