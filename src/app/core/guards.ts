import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './models';
import { AuthService } from './auth.service';

/** Exige sesión iniciada; si no, redirige al login recordando la URL solicitada. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Exige uno de los roles indicados en `data.roles`; si no, redirige a una pantalla sin permisos. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as Role[] | undefined) ?? [];
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  return auth.hasRole(roles) ? true : router.createUrlTree(['/sin-permisos']);
};

/** Evita mostrar el login a un usuario ya autenticado. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree(['/productos']) : true;
};
