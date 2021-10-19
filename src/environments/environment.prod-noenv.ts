import { VERSION } from '../VERSION';

export const environment = {
  production: true,
  environment: VERSION,
  isHomerAPI: true,
  apiUrl: window.location.protocol + '//' + (window.location.host) + '/api/v3',
};
