import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthenticationService } from '@app/services';
import { AlertService } from '../services/alert.service';
import { Router } from '@angular/router';
import { UserSecurityService } from '@app/services/user-security.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private router: Router,
        private userSecurityService: UserSecurityService,
        private translateService: TranslateService
    ) { }
        errMessages = []
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if(err instanceof HttpErrorResponse){
                if(err.status === 404 && err.message.match(/api/)) {
                    this.errMessages.push(err)
                    if(this.errMessages.length < 2) {
                        this.translateService.get('login.error.apiNotFound.header').subscribe(res => {
                            this.alertService.error({message: res, fullObject: JSON.stringify(err)});
                        })

                    }
                }
            }
            if (err.status === 401 && request.url.indexOf('/proxy') === -1) {
                // auto logout if 401 response returned from api
                this.authenticationService.logout();
                this.userSecurityService.removeUserSettings();

                const snapshotUrl = this.router.routerState.snapshot.url;

                if (!snapshotUrl.match('(system:login)')) {
                    this.router.navigate([{
                        outlets: { primary: null, system: 'login' }
                    }], {
                        queryParams: {
                            returnUrl: snapshotUrl
                        }
                    });

                }
            }
            if(err.name === 'HttpErrorResponse' && err.message.match(/i18n/) ) {
                console.log('%cBroken translate file, please contact Support Service.','font-weight: bold; margin:10px;border-radius:3px;padding:10px;background:black;color:white')
                this.alertService.error({
                        message:'Broken translate file, please contact Support Service.',
                        fullObject: JSON.stringify(err)
                    })
            }
            const error = err.error.message || err.statusText;
            if (err.error.message !== 'invalid or expired jwt' && err.status !== 0 && !err.message.match(/i18n/) && !err.message.match(/api/)) {
                this.alertService.error({message:error, fullObject: JSON.stringify(err)});
            } else if (err.status === 0) {
                this.alertService.error({isTranslation: true ,message:'notifications.error.noInternetError', fullObject: JSON.stringify(err)});
            }
            if (typeof err?.error?.size === 'number' && err.status === 400) {
                setTimeout(async () => {
                    const text = JSON.parse(await err.error.text()).message;
                    this.alertService.error({message:text, fullObject: JSON.stringify(err)});
                }, 0);
            }

            return throwError(error);

        }));
    }
}
