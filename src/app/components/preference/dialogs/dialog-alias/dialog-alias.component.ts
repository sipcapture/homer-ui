import { Component, Inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core'
import {
    Color,
    stringInputToObject,
} from '@angular-material-components/color-picker';@Component({
    selector: 'app-dialog-alias',
    templateUrl: './dialog-alias.component.html',
    styleUrls: ['./dialog-alias.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAliasComponent {
    @ViewChild('data_view', { static: false }) editor;
    aliasImg: any;
    imagesobject: any;
    aliasLink = '';
    isNotChanged = true;
    linkImgError;
    isLinkImg: boolean;
    isCopy = false;
    imagesParam = 'alias-images';
    ipobject = {
        image: '',
        color: {},
    };
    actionType: string;
    regString = /^[a-zA-Z0-9\-\_]+$/;
    regAliasString = /^[a-zA-Z0-9\-\_\&\@]+$/;
    regNum = /^[0-9]+$/;
    regip = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;

    alias = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(24),
        Validators.pattern(this.regAliasString)],
    );

    group = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(this.regString)
    ]);

    servertype = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(this.regString)
    ]);
    shardid = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(24),
        Validators.pattern(this.regString)]);

    mask = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(100),
        Validators.min(1),
        Validators.max(32),
        Validators.pattern(this.regNum)
    ]);

    port = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(100),
        Validators.min(0),
        Validators.max(65353),
        Validators.pattern(this.regNum)
    ]);

    type = new FormControl('', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(3),
        Validators.min(0),
        Validators.max(100),
        Validators.pattern(this.regNum)
    ]);

    ip = new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(45),
        Validators.pattern(this.regip)
    ]);

    public fontCtr: any = new FormControl(new Color(0, 0, 0), [
        Validators.required,
    ]);
    public backgroundCtr: any = new FormControl(new Color(245, 245, 245), [
        Validators.required,
    ]);
    public borderCtr: any = new FormControl(new Color(225, 225, 225), [
        Validators.required,
    ]);
    public color = { font: {}, background: {}, border: {} };

    constructor(
        public dialogRef: MatDialogRef<DialogAliasComponent>,
        public translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            data.data = {
                alias: 'localhost',
                ip: '127.0.0.1',
                port: 5060,
                mask: 32,
                captureID: 'CAP101',
                status: false,
            };
        }

        data.data.captureID = data.isnew ?
            'CAP101' :
            (typeof data.data.captureID === 'number' ?
                data.data.captureID : String(data.data.captureID)
            );

    }

    // handleImg() {
    //     if (this.aliasLink !== '') {
    //         const checked = this.checkExtension(this.aliasLink);
    //         if (checked) {
    //             this.isLinkImg = true;
    //             this.aliasImg = this.aliasLink;
    //             this.linkImgError = '';
    //             this.saveObj();
    //         } else {
    //             this.linkImgError = 'Non valid image link';
    //         }
    //     } else {
    //         this.isLinkImg = false;
    //         this.aliasImg = './img/gateways/phone.png';
    //         this.linkImgError = '';
    //         this.saveObj();
    //     }
    // }
    // saveObj() {
    //     const ipobj = {};

    //     for (const key in this.data.data) {
    //         if (key !== 'ipobject' && key !== 'uuid' && key !== 'version') {
    //             ipobj[key] = this.data.data[key];
    //         }
    //     }
    //     ipobj['color'] = {};
    //     // ipobj['alias'] = this.alias;
    //     ipobj['image'] = this.aliasImg;
    //     ipobj['isLinkImg'] = this.isLinkImg;
    //     ipobj['color'].font = this.fontCtr.value.toHexString();
    //     ipobj['color'].background = this.backgroundCtr.value.toHexString();
    //     ipobj['color'].border = this.borderCtr.value.toHexString();
    //     this.data.data.ipobject = JSON.stringify(ipobj, null, 4);
    // }

    checkExtension(imglink: string) {
        const valtoLower = imglink.toLowerCase();
        const regex = new RegExp('(.*?).(jpg|png|jpeg|gif)$'); // add or remove required exrtensions
        return regex.test(valtoLower);
    }

    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
    onSubmit() {
        if (!this.alias?.invalid &&
            !this.group?.invalid &&
            !this.servertype?.invalid &&
            !this.shardid?.invalid &&
            !this.mask?.invalid &&
            !this.port?.invalid &&
            !this.type?.invalid &&
            !this.ip?.invalid
        ) {
            (d => {
                d.alias = this.alias?.value;
                d.group = this.group?.value;
                d.servertype = this.servertype?.value;
                d.shardid = this.shardid?.value;
                d.mask = this.mask?.value;
                d.port = this.port?.value;
                d.type = this.type?.value;
                d.ip = this.ip?.value;
            })(this.data.data);

            this.dialogRef.close(this.data);
        } else {
            this.alias.markAsTouched();
            this.group.markAsTouched();
            this.servertype.markAsTouched();
            this.shardid.markAsTouched();
            this.mask.markAsTouched();
            this.port.markAsTouched();

            this.type.markAsTouched();
            this.ip.markAsTouched();

        }
    }

}
