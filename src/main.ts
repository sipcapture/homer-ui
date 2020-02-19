import 'hammerjs';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as module from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
const b = document.head.querySelector('base');
b.href = b.href + '';

platformBrowserDynamic().bootstrapModule(module.AppModule)
  .catch(err => console.error(err));
