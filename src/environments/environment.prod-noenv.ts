import { VERSION } from '../VERSION';

export const environment = {
  production: true,
  environment: VERSION + '(prod)',
  apiUrl: window.location.protocol + '//' + (window.location.host) + '/api/v3',
};
