import { VERSION } from '../VERSION';

export const environment = {
  production: true,
  environment: VERSION,
  isHomerAPI: true,
  apiUrl: location.protocol + '//' + (location.host) + '/api/v3',
};
