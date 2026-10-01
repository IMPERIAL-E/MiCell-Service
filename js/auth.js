// Registro, inicio de sesión y sesión persistente usando localStorage.
// Las contraseñas nunca se guardan en texto plano: se guarda un hash SHA-256 con sal.

import { Almacen } from "./almacen.js";
import { CUENTAS_DEMO } from "./config.js";

const CLAVE_USUARIOS = "usuarios";
const CLAVE_SESION = "sesion";
const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días con "Recordarme"

async function hashContrasena(password, sal) {
  const texto = `${sal}:${password}`;
  if (window.crypto?.subtle) {
    const datos = new TextEncoder().encode(texto);
    const buffer = await crypto.subtle.digest("SHA-256", datos);
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Respaldo para contextos sin crypto.subtle (por ejemplo, abrir el archivo sin servidor).
  let h = 5381;
  for (const c of texto) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return "djb2-" + h.toString(16);
}

function generarId(prefijo) {
  const aleatorio = window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefijo}-${aleatorio}`;
}

export class Usuario {
  constructor({ id, nombre, email, telefono, rol = "cliente", sal, hash, creado }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.telefono = telefono;
    this.rol = rol;
    this.sal = sal;
    this.hash = hash;
    this.creado = creado;
  }

  get esAdmin() {
    return this.rol === "admin";
  }

  get primerNombre() {
    return this.nombre.split(" ")[0];
  }

  // Versión sin datos sensibles para mostrar en pantalla o adjuntar a órdenes.
  publico() {
    return { id: this.id, nombre: this.nombre, email: this.email, telefono: this.telefono, rol: this.rol };
  }
}

export class Auth {
  static usuarios() {
    return Almacen.leer(CLAVE_USUARIOS, []).map((u) => new Usuario(u));
  }

  static buscarPorEmail(email) {
    const buscado = email.trim().toLowerCase();
    return Auth.usuarios().find((u) => u.email === buscado) ?? null;
  }

  static buscarPorId(id) {
    return Auth.usuarios().find((u) => u.id === id) ?? null;
  }

  static async registrar({ nombre, email, telefono, password, rol = "cliente" }) {
    const correo = email.trim().toLowerCase();
    if (Auth.buscarPorEmail(correo)) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    const sal = generarId("sal");
    const usuario = new Usuario({
      id: generarId("usr"),
      nombre: nombre.trim(),
      email: correo,
      telefono: telefono.trim(),
      rol,
      sal,
      hash: await hashContrasena(password, sal),
      creado: new Date().toISOString(),
    });
    const lista = Almacen.leer(CLAVE_USUARIOS, []);
    lista.push({ ...usuario });
    Almacen.guardar(CLAVE_USUARIOS, lista);
    return usuario;
  }

  static async iniciarSesion(email, password, recordar = true) {
    const usuario = Auth.buscarPorEmail(email);
    if (!usuario || (await hashContrasena(password, usuario.sal)) !== usuario.hash) {
      throw new Error("Correo o contraseña incorrectos.");
    }
    const sesion = { usuarioId: usuario.id, inicio: Date.now(), expira: Date.now() + DURACION_SESION_MS };
    // "Recordarme" guarda la sesión en localStorage; si no, solo dura mientras la pestaña esté abierta.
    Almacen.borrar(CLAVE_SESION, "local");
    Almacen.borrar(CLAVE_SESION, "sesion");
    Almacen.guardar(CLAVE_SESION, sesion, recordar ? "local" : "sesion");
    return usuario;
  }

  static cerrarSesion() {
    Almacen.borrar(CLAVE_SESION, "local");
    Almacen.borrar(CLAVE_SESION, "sesion");
  }

  static usuarioActual() {
    const sesion = Almacen.leer(CLAVE_SESION, null, "sesion") ?? Almacen.leer(CLAVE_SESION, null, "local");
    if (!sesion) return null;
    if (sesion.expira < Date.now()) {
      Auth.cerrarSesion();
      return null;
    }
    return Auth.buscarPorId(sesion.usuarioId);
  }

  // Redirige al login si no hay sesión; devuelve el usuario si la hay.
  static exigirSesion({ soloAdmin = false } = {}) {
    const usuario = Auth.usuarioActual();
    if (!usuario) {
      const volver = encodeURIComponent(location.pathname.split("/").pop() + location.search);
      location.replace(`login.html?volver=${volver}`);
      return null;
    }
    if (soloAdmin && !usuario.esAdmin) {
      location.replace("index.html");
      return null;
    }
    return usuario;
  }

  // Crea las cuentas de demostración la primera vez que se abre el sitio.
  static async sembrarCuentasDemo() {
    for (const cuenta of CUENTAS_DEMO) {
      if (!Auth.buscarPorEmail(cuenta.email)) {
        await Auth.registrar(cuenta);
      }
    }
  }
}
