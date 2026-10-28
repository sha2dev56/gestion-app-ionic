import { Injectable, computed, signal } from '@angular/core';

export type Rol = 'admin' | 'usuario';

export interface Sesion {
  email: string;
  nombre: string;
  rol: Rol;
}

interface UsuarioMock extends Sesion {
  passwordHash: string;
}

// Datos sintéticos: solo se guarda el hash, nunca la contraseña.
const USUARIOS: UsuarioMock[] = [
  {
    email: 'admin@demo.test',
    nombre: 'Admin Demo',
    rol: 'admin',
    passwordHash:
      'b5af2beb9b7fd5aa4eb21b61925bd3856793e54e0a39052fbcfaf5b477fd07f3',
  },
  {
    email: 'usuario@demo.test',
    nombre: 'Usuario Demo',
    rol: 'usuario',
    passwordHash:
      '9c8d2e707f21036711b5c9a27e10671255c323458507be0742d72d5c3f18fa84',
  },
];

const CLAVE_SESION = 'sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _sesion = signal<Sesion | null>(this.cargarSesion());

  readonly sesion = this._sesion.asReadonly();
  readonly estaAutenticado = computed(() => this._sesion() !== null);
  readonly rol = computed(() => this._sesion()?.rol ?? null);

  async login(email: string, password: string): Promise<boolean> {
    const hash = await this.sha256(password);
    const usuario = USUARIOS.find(
      (u) => u.email === email.trim().toLowerCase() && u.passwordHash === hash,
    );
    if (!usuario) {
      return false;
    }
    const { passwordHash, ...sesion } = usuario;
    this._sesion.set(sesion);
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    return true;
  }

  logout(): void {
    this._sesion.set(null);
    sessionStorage.removeItem(CLAVE_SESION);
  }

  private cargarSesion(): Sesion | null {
    try {
      const raw = sessionStorage.getItem(CLAVE_SESION);
      return raw ? (JSON.parse(raw) as Sesion) : null;
    } catch {
      return null;
    }
  }

  private async sha256(texto: string): Promise<string> {
    const datos = new TextEncoder().encode(texto);
    const buffer = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}