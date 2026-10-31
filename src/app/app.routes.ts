import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';

/** Rutas con carga diferida (lazy loading) y protección por rol. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos' },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Iniciar sesión · Gestión App',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    title: 'Productos · Gestión App',
    loadComponent: () => import('./pages/productos/productos.page').then((m) => m.ProductosPage),
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    title: 'Usuarios · Gestión App',
    loadComponent: () => import('./pages/usuarios/usuarios.page').then((m) => m.UsuariosPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    title: 'Panel · Gestión App',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'ayuda',
    canActivate: [authGuard],
    title: 'Ayuda · Gestión App',
    loadComponent: () => import('./pages/ayuda/ayuda.page').then((m) => m.AyudaPage),
  },
  {
    path: 'sin-permisos',
    title: 'Sin permisos · Gestión App',
    loadComponent: () => import('./pages/sin-permisos/sin-permisos.page').then((m) => m.SinPermisosPage),
  },
  { path: '**', redirectTo: 'productos' },
];
