import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './services';
import { User } from './models';
import { Functions } from './helpers/functions';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    currentUser: User;
    title = 'HOMER UI';

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService
        // private titleService: Title
    ) {
        this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
        window['console2file'] = Functions.console2file;
    }
}
