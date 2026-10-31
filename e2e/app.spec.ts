import { expect, test } from '@playwright/test';

// Las credenciales de prueba se pasan por entorno (no se guardan en el repositorio).
const email = process.env['E2E_ADMIN_EMAIL'] ?? '';
const password = process.env['E2E_ADMIN_PASSWORD'] ?? '';

test('redirige al login si no hay sesión', async ({ page }) => {
  await page.goto('/productos');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

test('login de administrador y acceso a productos', async ({ page }) => {
  test.skip(!email || !password, 'Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD');
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo de productos' })).toBeVisible();
});
