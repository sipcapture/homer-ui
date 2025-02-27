// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// export const environment = {
//   production: false,
//   apiUrl: 'http://localhost/api/v3'
// };
import { VERSION } from '../VERSION';

declare const window: any;

let _environment: any = {
  production: false,
  environment: VERSION,
  isHomerAPI: true,
  apiUrl: location.protocol + '//' + (location.host) + '/api/v3'
};

if (typeof window.GLOBAL_CONFIG == "object") {
  _environment.apiUrl = window.GLOBAL_CONFIG.API_PATH;
}

export const environment = _environment;
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
