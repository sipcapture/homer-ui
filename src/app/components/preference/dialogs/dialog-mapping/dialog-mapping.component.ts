import { Component, Inject, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PreferenceScriptsService } from '@app/services';
import { TranslateService } from '@ngx-translate/core'
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import 'brace';
import 'brace/mode/text';
import 'brace/theme/github';
@Component({
  selector: 'app-dialog-mapping',
  templateUrl: './dialog-mapping.component.html',
  styleUrls: ['./dialog-mapping.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogMappingComponent {
  @ViewChild('correlation_mapping_view', { static: false }) correlationEditor;
  @ViewChild('fields_mapping_view', { static: false }) mappingEditor;
  @ViewChild('fields_script_view', { static: false }) scriptEditor;
  @ViewChild('fields_user_view', { static: false }) userEditor;
  fieldIndex = 0
  isDisabled = false;
  isValidForm = false;
  isAdmin = false;
  regNum = /^[0-9]+$/;
  regString = /^[a-zA-Z0-9\-\_]+$/;
  // scripts params
  isScript = false;
  scriptUpd = false;
  fieldsTableFields = [];
  fieldsTasbleColumns = [];
  dataSource = new MatTableDataSource([{}]);
  @ViewChild(MatSort, { static: true }) sorter: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  columns = [];
  specialColumns = [];
  public mappingScript: any = { data: ''};

  hep_alias = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(100),
    Validators.pattern(this.regString)
  ]);
  profile = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ]);
  hepid = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
    Validators.maxLength(4),
    Validators.min(1),
    Validators.max(10000),
    Validators.pattern(this.regNum)
  ]);

  constructor(
    public dialogRef: MatDialogRef<DialogMappingComponent>,
    private scriptService: PreferenceScriptsService,
    public translateService: TranslateService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
    if (data.isnew) {
      data.data = {
        hep_alias: '',
        hepid: 10,
        profile: '',
        correlation_mapping: {},
        fields_mapping: [],
        user_mapping: [],
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
    data.data.user_mapping = data.isnew ?
      '[]' :
      (typeof data.data.user_mapping === 'string' ?
        data.data.user_mapping :
        JSON.stringify(data.data.user_mapping, null, 4)
      );

    (d => {
      
      this.hep_alias.setValue(d.hep_alias);
      this.hepid.setValue(d.hepid);
      this.profile.setValue(d.profile);

    })(data.data);
    if (data.data.fields_mapping) {
      try {
        this.fieldsTasbleColumns = [
          "ID", "Type", "Name", "Index", "Alias"
        ];

        this.fieldsTableFields = JSON.parse(data?.data?.fields_mapping).map(m => ({
          id: m.id,
          type: m.type,
          name: m.name,
          index: m.index,
          alias: m.alias
        }));

        this.dataSource.data = this.fieldsTableFields
      } catch (e) {
          console.log(e);

      }

    }

    this.isValidForm = true;
  }
  ngOnInit(): void {}

  ngAfterViewInit() {
    const options = {
      esnext: true,
      moz: true,
      devel: true,
      browser: true,
      node: true,
      laxcomma: true,
      laxbreak: true,
      lastsemic: true,
      onevar: false,
      passfail: false,
      maxerr: 10000,
      expr: true,
      multistr: true,
      globalstrict: true
    };
    this.scriptEditor?.getEditor().getSession().$worker.call("setOptions", [options]);
    this.cdr.detectChanges();
  }
  validate(type) {
    let editor;
    if (type === 'mapping') {
      editor = this.mappingEditor;
    } else {
      editor = this.correlationEditor;
    }
    if (editor.getEditor().getSession().getAnnotations().length > 0) {
      this.isDisabled = true;
    } else {
      this.isDisabled = false;
    }
  }
  disableClose(e) {
    this.dialogRef.disableClose = e;
  }
  scriptValidate() {
    this.scriptUpd = true;

  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  import(text, type) {
    if (type !== 'script') {
      this.data.data[type] = text;
    } else {
      this.mappingScript.data = text;
    }
  }
  onSubmit() {
    if (
      !this.hep_alias?.invalid &&
      !this.hepid?.invalid &&
      !this.profile?.invalid
    ) {
      (d => {
        d.hep_alias = this.hep_alias?.value;
        d.hepid = this.hepid?.value;
        d.profile = this.profile?.value;
      })(this.data.data);
      if (this.isScript && this.scriptUpd) {
        this.scriptService.update(this.mappingScript).toPromise().then(data => data)
      }
      this.dialogRef.close(this.data);
    } else {
      this.hep_alias.markAsTouched();
      this.hepid.markAsTouched();
      this.profile.markAsTouched();
    }
  }
}
