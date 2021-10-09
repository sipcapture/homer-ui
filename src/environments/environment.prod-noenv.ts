import { VERSION } from '../VERSION';

export const environment = {
  production: true,
  environment: VERSION,
  apiUrl: window.location.protocol + '//' + (window.location.host) + '/api/v3',
};
