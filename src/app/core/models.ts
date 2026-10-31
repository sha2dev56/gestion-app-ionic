/** Roles soportados por el sistema de control de acceso. */
export type Role = 'admin' | 'user';

/** Sesión autenticada del usuario actual. */
export type Session = {
  token: string;
  email: string;
  nombre: string;
  role: Role;
};

/** Usuario del sistema (origen SQL / API REST). */
export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  role: Role;
};

/** Datos necesarios para dar de alta un usuario. */
export type NuevoUsuario = {
  nombre: string;
  email: string;
  role: Role;
  password: string;
};

/** Producto del catálogo (origen SQL / API REST). */
export type Producto = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
};

export type TipoActividad = 'venta' | 'alta' | 'incidencia';

/** Documento de actividad (origen NoSQL en tiempo real, estilo Firestore). */
export type Actividad = {
  id: string;
  tipo: TipoActividad;
  usuario: string;
  importe: number;
  fecha: string;
};

/** Definición de columna para el componente de tabla. */
export type TableColumn = {
  key: string;
  label: string;
  /** Alinea a la derecha y ordena numéricamente. */
  numeric?: boolean;
  /** Formateador opcional sólo para mostrar el valor (no afecta a la ordenación ni a la exportación). */
  format?: (value: unknown) => string;
};

/** Fila genérica admitida por los componentes de presentación. */
export type TableRow = Record<string, unknown>;
