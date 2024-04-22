import { VERSION } from '../VERSION';

export const environment = {
  production: false,
  environment: VERSION + '(dev)',
  isHomerAPI: true,
  apiUrl: location.protocol + '//' + (location.host) + '/api/v3'
};
