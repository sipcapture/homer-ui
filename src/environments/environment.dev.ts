import { VERSION } from '../VERSION';

export const environment = {
  production: false,
  environment: VERSION + '(dev)',
  isHomerAPI: true,
  // apiUrl: window.location.protocol + '//' + (window.location.host) + '/api/v3'
  apiUrl: 'http://localhost:9080/api/v3'
};
