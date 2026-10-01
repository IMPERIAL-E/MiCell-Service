// Capa de acceso a localStorage / sessionStorage.
// Todo se guarda como JSON bajo el prefijo "reparacel:" para no chocar con otros sitios.

const PREFIJO = "reparacel:";

function areaDe(tipo) {
  try {
    return tipo === "sesion" ? window.sessionStorage : window.localStorage;
  } catch {
    return null; // navegador en modo privado estricto o almacenamiento bloqueado
  }
}

export class Almacen {
  static leer(clave, porDefecto = null, tipo = "local") {
    try {
      const valor = areaDe(tipo)?.getItem(PREFIJO + clave);
      return valor === null || valor === undefined ? porDefecto : JSON.parse(valor);
    } catch {
      return porDefecto;
    }
  }

  static guardar(clave, valor, tipo = "local") {
    try {
      areaDe(tipo)?.setItem(PREFIJO + clave, JSON.stringify(valor));
      return true;
    } catch {
      return false;
    }
  }

  static borrar(clave, tipo = "local") {
    try {
      areaDe(tipo)?.removeItem(PREFIJO + clave);
    } catch {
      /* sin almacenamiento disponible */
    }
  }
}
