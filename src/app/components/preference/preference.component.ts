import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    ViewChild,
    AfterViewInit,
    ElementRef,
    QueryList,
    ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router, ActivationEnd } from '@angular/router';

import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';

import { AuthenticationService } from '@app/services';
import { PreferencesComponentMapping } from '@app/models/preferences-component-mapping';
import { TranslateService } from '@ngx-translate/core';
import { AdminService } from '@app/services/preferences/admin.service';
@Component({
    selector: 'app-preference',
    templateUrl: './preference.component.html',
    styleUrls: ['./preference.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PreferenceComponent implements OnInit, OnDestroy, AfterViewInit {
    isLoading = false;
    isAdmin = false;
    isTest = true;
    isHasLocalStorage = false;
    isErrorResponse = false;
    toolType = '';
    filter = '';
    service: any;
    isResetDashboard = true;
    isResetMapping = true;
    isConfigTab = false;
    isResyncTab = false;
    dataSource = new MatTableDataSource([{}]);
    configSource = new MatTableDataSource([{}]);
    isAccess = {};
    dbList = [];
    files = [];
    timeout: any;
    linkDictionary;

    public pageId: string;
    public links: Array<string> = [];
    public pagesStructure: any = {};

    @ViewChildren(MatPaginator) paginators !: QueryList<MatPaginator>;
    @ViewChildren(MatSort) sorters !: QueryList<MatSort>;
    @ViewChild('content', { static: false }) content: ElementRef;

    ngAfterViewInit() {
        this._route.params.subscribe((params) => {
            this.pageId = decodeURI(params['id']);
            if (this.links.indexOf(this.pageId) === -1) {
                this.router.navigateByUrl('/dashboard/home');
                return;
            }
            this.cdr.detectChanges();
        });
    }

    constructor(
        private authenticationService: AuthenticationService,
        private router: Router,
        private _route: ActivatedRoute,
        public dialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private translateService: TranslateService,
        private adminService: AdminService
    ) {
        const ADMIN = 'admin';
        const userData = this.authenticationService.currentUserValue;
        this.isAdmin = userData?.user?.admin === true;
        const access = ['commonUser', ADMIN][+this.isAdmin];
        const { accessMapping, pagesStructureMapping, links } = PreferencesComponentMapping || {};
        this.isAccess = accessMapping[access];
        this.pagesStructure = pagesStructureMapping[access];
        this.links = links[access];

        /**
         * SHOW Admin-settings page only for Super Admin
         */

        if (this.isAdmin && userData?.user?.username === ADMIN) {
            /**
             * check if available on server side too
             */
            // this.adminService.checkIsActive().then(({ data: { active } }: any) => {
            //     this.links = this.links.filter(link => link !== ADMIN);
            //     if (active === true) {
            //         this.links.push(ADMIN);
            //     }
            // });
        }

        this.translateService.get('preference.pages').subscribe(res =>
            this.linkDictionary = res
        );
        router.events
            .pipe(filter((e) => e instanceof ActivationEnd))
            .subscribe((evt: ActivationEnd) => {
                this.pageId = decodeURI(evt.snapshot.params?.id);
                this.cdr.detectChanges();
            });
    }

    i18n(pageId) {
        return this.linkDictionary?.[pageId] || pageId;
    }

    ngOnInit() {

    }
    access(pageId, funcName): boolean {
        return !!this.isAccess[pageId] && !!this.isAccess[pageId][funcName];
    }

    preferenceGo(id: string) {
        this.filter = '';
        this.router.navigate(['preference/' + encodeURI(id).toLowerCase()]);
        const current = document.getElementsByClassName('activated');
        const linked = document.getElementById(id + '-setting');
        if (current.length <= 0) {
            linked.classList.add('activated');
        } else {
            current[0].classList.remove('activated');
            linked.classList.add('activated');
        }
    }
    ngOnDestroy() { }
}

export class FileUploadModel {
    data: File;
    state: string;
    inProgress: boolean;
    progress: number;
    canRetry: boolean;
    canCancel: boolean;
    sub?: Subscription;
}
