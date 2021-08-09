import { Component, Inject, ViewChild, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationService, DashboardService } from '@app/services';
import { Functions } from '@app/helpers/functions';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { UrlWarningDialog } from './url-warning-dialog/url-warning-dialog.component';
import { TranslateService } from '@ngx-translate/core'
@Component({
  selector: 'app-add-dashboard-dialog',
  templateUrl: './add-dashboard-dialog.component.html',
  styleUrls: ['./add-dashboard-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDashboardDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fileSelect', { static: true }) fileSelect;

  idDrugOver = false;
  typeList = [];
  typeBoolean = {
    CUSTOM: {
      isActive: true,
      type: 1
    },
    FRAME: {
      isActive: true,
      type: 2,
    },
    HOME: {
      isActive: true,
      type: 3
    },
    SEARCH: {
      isActive: true,
      type: 4,
    },
    ALARM: {
      isActive: true,
      type: 5
    },
    GRAFANA: {
      isActive: true,
      type: 7 // not an error, workaround because "Search TAB" is type 6
    }
  };
  dashboards: any;
  isInvalid = false;
  regString = /^[a-zA-Z0-9\-\_\s]+$/;
  isConfirmed = false;
  nameNewPanel = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(40),
    Validators.pattern(this.regString)
  ],
    this.dNameValidator.bind(this)
  );
  constructor(
    public dialogRef: MatDialogRef<AddDashboardDialogComponent>,
    private dashboardService: DashboardService,
    private authenticationService: AuthenticationService,
    public dialog: MatDialog,
    public translateService: TranslateService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any = {}
  ) {
    translateService.addLangs(['en'])
    translateService.setDefaultLang('en')
    this.dashboardService.getDashboardInfo().toPromise().then((list: any) => {
      if (list?.data?.length > 0) {
        this.typeBoolean.HOME.isActive = !!list.data.find(i => i.id === 'home');
        this.typeBoolean.SEARCH.isActive = !!list.data.find(i => i.id === 'search');
      }
      this.typeList = Object.keys(this.typeBoolean).map(item => ({
        type: this.typeBoolean[item].type,
        name: item
      })).filter(i => this.typeBoolean[i.name].isActive);
    });
  }
  async ngOnInit() {
    const resData: any = await this.dashboardService.getDashboardInfo(0).toPromise();
    const currentUser = this.authenticationService.getUserName();
    if (resData?.data) {
      this.dashboards = resData.data.sort((...aa: any[]) => {
        const [a, b] = aa.map(({ name }: { name: string }) => name.charCodeAt(0));
        return a < b ? -1 : a > b ? 1 : 0;
      })
        .filter(item => item.shared === false || item.owner === currentUser)
        .map(dashboard => dashboard.name.replace(/\s+/, ' ').toLowerCase().trim());
    }
  }

  ngAfterViewInit() {
    const hsp = e => {
      this.idDrugOver = e.type === 'dragover';
      e.preventDefault();
      e.stopPropagation();
    };
    const handlerDrop = e => {
      hsp(e);
      Array.from(e.dataTransfer.files).forEach(this.handlerUpload.bind(this));
    };
    const objEvents = {
      submit: hsp, drag: hsp, dragstart: hsp, dragend: hsp,
      dragover: hsp, dragenter: hsp, dragleave: hsp,
      drop: handlerDrop, change: e => this.handlerUpload(e.target.files[0])
    };
    Object.keys(objEvents).forEach(eventName => {
      this.fileSelect.nativeElement.addEventListener(eventName, objEvents[eventName]);
    });
  }
  private async handlerUpload(file: any) {
    if (!this.data) {
      this.data = {};
    }
    const text = await file.text();
    const dashboard = Functions.JSON_parse(text);
    this.data.nameNewPanel = dashboard.data.name;
    this.data.type = dashboard.data.type || 1;
    this.data.param = dashboard.data.param || '';
    this.data.dashboard = dashboard.data;
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  identify(index, item) {
    return item.index;
  }
  validate(event) {
    if (event === '' || !event) {
      return;
    }
    event = event.toLowerCase().trim();
    if (this.dashboards?.some(dashboard => dashboard === event.replace(/\s+/, ' ')) || event === 'home') {
      this.isInvalid = true;
    } else {
      this.isInvalid = false;
    }
    this.nameNewPanel.markAsTouched();
    this.cdr.detectChanges();
  }

  ngOnDestroy() { }

  dNameValidator(dashboardControl: AbstractControl) {
    return new Promise(resolve => {
      let validated = false;
      this.isTaken(dashboardControl.value.replace(/\s+/, ' ').trim()).then(data => {
        validated = data;
        if (validated) {
          resolve({ dashboardNotAvailable: true });
          setTimeout(() => {
            this.nameNewPanel.markAsTouched();
            this.cdr.detectChanges();
          }, 10);
        } else {
          resolve(null);
          setTimeout(() => {
            this.nameNewPanel.markAsTouched();
            this.cdr.detectChanges();
          }, 10);
        }
      });
    });
  }
  async isTaken(dashboard) {
    if (this.dashboards?.length > 0) {
      return ([].concat(this.dashboards) || []).includes(dashboard.toLowerCase());
    }
    return null;
  }
  onSubmit() {
    if (!this.nameNewPanel?.invalid) {
      (d => {
        d.nameNewPanel = this.nameNewPanel?.value;
      })(this.data);
      if ((this.data.type === 2 || this.data.type === 7) && this.data.param === '' && !this.isConfirmed) {
        this.dialog.open(UrlWarningDialog, { width: '350px', data: {} }).afterClosed().toPromise().then(res => {
          if (res) {

            this.isConfirmed = true;
          }
        });
      } else {
        this.dialogRef.close(this.data);
      }
    } else {
      this.nameNewPanel.markAsTouched();
    }
  }

}
