import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { authInterceptor } from './core/auth.interceptor';
import { mockBackendInterceptor } from './core/mock-backend.interceptor';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Orden: primero se añade el token, después el backend simulado responde.
    provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
