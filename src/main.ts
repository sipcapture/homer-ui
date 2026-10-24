import { AllCommunityModule, ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// ag-grid 33+ starts with no modules and no theme. The UI still ships the
// ag-theme-material CSS, so keep the legacy theme instead of the new theming API.
ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({ theme: 'legacy' });

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
