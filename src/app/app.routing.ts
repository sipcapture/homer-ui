import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards';
import {
    SearchGridCallComponent,
    LoginComponent,
    DashboardComponent,
    PreferenceComponent
} from '@app/components';
import { DetailDialogComponent } from './components/search-grid-call';


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
    path: 'search/result/:id',
    component: SearchGridCallComponent,
    canActivate: [AuthGuard]
}, {
    path: 'transaction/:uuid',
    component: DetailDialogComponent,
    canActivate: [AuthGuard]
}, {
    path: 'login',
    component: LoginComponent,
    outlet: 'system'
}, {
    path: '',
    redirectTo: 'dashboard/home',
    pathMatch: 'full'
}, {
    path: '**', redirectTo: 'dashboard/home'
}, {
    path: 'dashboard/home/**', redirectTo: 'dashboard/home'
}];

export const routing = RouterModule.forRoot(appRoutes, { enableTracing: false });
