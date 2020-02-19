import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards';
import {
    SearchGridCallComponent,
    LoginComponent,
    DashboardComponent,
    PreferenceComponent
} from '@app/components';


const appRoutes: Routes = [{
    path: 'dashboard/:id',
    component: DashboardComponent,
    canActivate: [AuthGuard]
}, {
    path: 'preference/:id',
    component: PreferenceComponent,
    canActivate: [AuthGuard]
}, {
    path: 'search/result',
    component: SearchGridCallComponent,
    canActivate: [AuthGuard]
}, {
    path: 'login',
    component: LoginComponent,
    outlet: 'system'
}, {
    path: '',
    redirectTo: 'dashboard/home',
    pathMatch: 'full'
}];

export const routing = RouterModule.forRoot(appRoutes, { enableTracing: false });
