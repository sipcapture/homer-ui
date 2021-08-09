import { VERSION } from '../VERSION';

export const environment = {
  production: false,
  environment: VERSION + '(dev)',
  // apiUrl: window.location.protocol + '//' + (window.location.host) + '/api/v3'
  apiUrl: 'http://homer.null.qxip.net/api/v3'
};
