import { Component } from '@angular/core';
import { AlertService, AuthenticationService } from './services';
import { User } from '@app/models';

import { Functions } from './helpers/functions';
import {TranslateService} from '@ngx-translate/core';


@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    currentUser: User;
    title = 'HOMER';
    translateError = false
    constructor(
        private authenticationService: AuthenticationService,
        public translateService: TranslateService,
        public alertService: AlertService
        ) {

        if (!this.authenticationService?.currentUserValue) {
            this.authenticationService.logout();
        }
        this.authenticationService.currentUser.subscribe(x => {
          
                this.currentUser = x;
        
        });
        window['console2file'] = Functions.console2file;
        // this language will be used as a fallback when a translation isn't found in the current language
        translateService.setDefaultLang('en');

         // the lang to use, if the lang isn't available, it will use the current loader to get them
        translateService.use('en').subscribe( data => {
            try{
               if(data) this.translateError = false
            }catch(e){
                // console.log(e)
                this.translateError = true;
                this.alertService.error('Please check JSON translate file')

            }
        });
    }
}
