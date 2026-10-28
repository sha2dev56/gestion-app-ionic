import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'admin',
    canActivate: [rolGuard('admin')],
    loadComponent: () =>
      import('./pages/admin/admin.page').then((m) => m.AdminPage),
  },
];