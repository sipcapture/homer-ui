import { VERSION } from '../VERSION';

declare const window: any;

let _environment: any = {
  production: true,
  environment: VERSION,
  isHomerAPI: true,
  apiUrl: location.protocol + '//' + (location.host) + '/api/v3',
};

if (typeof window.GLOBAL_CONFIG == "object") {
  _environment.apiUrl = window.GLOBAL_CONFIG.API_PATH;
}

export const environment = _environment;
