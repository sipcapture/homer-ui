import { VERSION } from '../VERSION';

declare var $ENV: Env;

interface Env {
  ENVIRONMENT: string;
  apiUrl: string;
}

export const environment = {
  production: true,
  environment: VERSION + '(prod)',
  apiUrl: $ENV.apiUrl || window.location.protocol + '//' + (window.location.host) + '/api/v3',
};
