import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
    AbstractControl,
    Validators,
    FormControl,
} from '@angular/forms';
import { AuthenticationService, PreferenceAdvancedService, PreferenceIpAliasService } from '@app/services';
import { ThemePalette } from '@angular/material/core';
import 'brace';
import 'brace/mode/text';
import 'brace/theme/github';
import { Functions } from '@app/helpers/functions';
import {
    Color,
    stringInputToObject,
} from '@angular-material-components/color-picker';
import { TranslateService } from '@ngx-translate/core'
@Component({
    selector: 'app-dialog-ipalias',
    templateUrl: './dialog-ipalias.component.html',
    styleUrls: ['./dialog-ipalias.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogIpAliasComponent implements OnInit {
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
    json;

    public disabled = false;

    public colorTheme: ThemePalette = 'primary';
    isValidForm = false;
    isAdmin = false;
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
        private _pas: PreferenceAdvancedService,
        private authService: AuthenticationService,
        private aliasService: PreferenceIpAliasService,
        public translateService: TranslateService,
        public dialogRef: MatDialogRef<DialogIpAliasComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {

        translateService.addLangs(['en'])
        translateService.setDefaultLang('en')
        if (data.isnew) {
            this.aliasImg = './img/gateways/phone.png';
            data.data = {
                uuid: ' ',
                alias: '',
                group: '',
                mask: 32,
                shardid: 'voipprovider',
                ip: '',
                ipv6: false,
                ipobject: {
                    image: this.aliasImg,
                    isLinkImg: false,
                },
                port: 5060,
                servertype: '',
                type: 0,
                status: true,
            };
        } else {
            this.actionType = data.data.actionType;
            if (this.actionType === 'data-preview') {
                this.json = data.data.ipobject;
            }
        }

        const userData = this.authService.currentUserValue;
        this.isAdmin = !!userData?.user?.admin;
        this.isCopy = data.isCopy;
        if (this.isCopy) { this.isNotChanged = true; }
        data.data.ipobject = data.isnew
            ? JSON.stringify(this.ipobject, null, 4)
            : typeof data.data.ipobject === 'string'
                ? data.data.ipobject
                : JSON.stringify(data.data.ipobject, null, 4);
        const ipobj = Functions.JSON_parse(data.data.ipobject);
        if (ipobj.image) {
            this.aliasImg = ipobj.image;
            this.isLinkImg = ipobj.isLinkImg;
            if (this.isLinkImg) {
                this.aliasLink = this.aliasImg;
            }
        }
        if (ipobj.color) {
            if (ipobj.color.font && typeof ipobj.color.font === 'string') {
                const { r, g, b, a } = stringInputToObject(ipobj.color.font);
                this.fontCtr.setValue(new Color(r, g, b, a));
            }
            if (
                ipobj.color.background &&
                typeof ipobj.color.background === 'string'
            ) {
                const { r, g, b, a } = stringInputToObject(ipobj.color.background);
                this.backgroundCtr.setValue(new Color(r, g, b, a));
            }

            if (ipobj.color.border && typeof ipobj.color.border === 'string') {
                const { r, g, b, a } = stringInputToObject(ipobj.color.border);
                this.borderCtr.setValue(new Color(r, g, b, a));
            }
        }

        this.color.font = this.fontCtr.value;
        this.color.background = this.backgroundCtr.value;
        this.color.border = this.borderCtr.value;
        (d => {
            this.alias.setValue(d.alias);
            this.group.setValue(d.group);
            this.servertype.setValue(d.servertype);
            this.shardid.setValue(d.shardid);
            this.mask.setValue(d.mask);
            this.port.setValue(d.port);
            this.type.setValue(d.type);
            this.ip.setValue(d.ip);
        })(data.data);
        this.isValidForm = true;
    }

    ngOnInit() {
        this.getImages();
    }

    async getImages() {
        const settingObj = await this.getSettings(this.imagesParam, 'ui');
        this.imagesobject = this._pas?.getSettingData(settingObj);
        this.saveObj();
    }

    saveObj() {
        const ipobj = {};

        for (const key in this.data?.data) {
            if (key !== 'ipobject' && key !== 'uuid' && key !== 'version') {
                ipobj[key] = this.data.data[key];
            }
        }
        ipobj['color'] = {};
        // ipobj['alias'] = this.alias;
        ipobj['image'] = this.aliasImg;
        ipobj['isLinkImg'] = this.isLinkImg;
        ipobj['color'].font = this.fontCtr.value.toHexString();
        ipobj['color'].background = this.backgroundCtr.value.toHexString();
        ipobj['color'].border = this.borderCtr.value.toHexString();
        this.data.data.ipobject = JSON.stringify(ipobj, null, 4);
    }

    checkExtension(imglink: string) {
        const valtoLower = imglink.toLowerCase();
        const regex = new RegExp('(.*?).(jpg|png|jpeg|gif)$'); // add or remove required exrtensions
        return regex.test(valtoLower);
    }

    handleImg() {
        if (this.aliasLink !== '') {
            const checked = this.checkExtension(this.aliasLink);
            if (checked) {
                this.isLinkImg = true;
                this.aliasImg = this.aliasLink;
                this.linkImgError = '';
                this.saveObj();
            } else {
                this.linkImgError = 'Non valid image link';
            }
        } else {
            this.isLinkImg = false;
            this.aliasImg = './img/gateways/phone.png';
            this.linkImgError = '';
            this.saveObj();
        }
    }

    async getSettings(param, category) {
        return this._pas.getSetting(param, category);
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
    aliasValidator(aliasControl: AbstractControl) {
        return new Promise(resolve => {
            setTimeout(() => {
                if (this.aliasTaken(aliasControl.value)) {
                    resolve({ aliasNotAvailable: true });
                } else {
                    resolve(null);
                }
            }, 500);
        });
    }
    async aliasTaken(alias) {
        return this.aliasService.getAll().then((aliases: any) => {
            return aliases?.data?.map?.(m => m?.alias);
        }).then(aliases => aliases.includes(alias));
    }
    disableClose(e) {
        this.dialogRef.disableClose = e;
    }
    import(text) {
        this.data.data.ipobject = text;
    }
}
