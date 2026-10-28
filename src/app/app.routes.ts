import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'folder/Inbox',
    pathMatch: 'full',
  },
  {
    path: 'folder/:folder',
    loadComponent: () => import('./folder/folder.page').then((m) => m.FolderPage),
  },
  {
    path: 'alta-empleado',
    loadComponent: () => import('./pages/alta-empleado/alta-empleado.page').then((m) => m.AltaEmpleadoPage),
  },
    {
    path: 'alta-empleado',
    canActivate: [rolGuard('admin')],
    loadComponent: () =>
      import('./pages/alta-empleado/alta-empleado.page').then(
        (m) => m.AltaEmpleadoPage,
      ),
  }
];
