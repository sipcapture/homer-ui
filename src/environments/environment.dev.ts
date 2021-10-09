import { VERSION } from '../VERSION';

export const environment = {
  production: false,
  environment: VERSION + '(dev)',
  // apiUrl: window.location.protocol + '//' + (window.location.host) + '/api/v3'
  apiUrl: 'http://127.0.0.1:8080/api/v3'
};
