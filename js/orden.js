// Órdenes (tickets) de reparación guardadas en localStorage.

import { Almacen } from "./almacen.js";

const CLAVE_ORDENES = "ordenes";

export const ESTADOS = [
  { id: "recibida", nombre: "Recibida", descripcion: "Recibimos tu solicitud." },
  { id: "diagnostico", nombre: "En diagnóstico", descripcion: "Un técnico está revisando el equipo." },
  { id: "reparacion", nombre: "En reparación", descripcion: "Estamos reparando tu equipo." },
  { id: "lista", nombre: "Lista para entregar", descripcion: "Tu equipo está listo." },
  { id: "entregada", nombre: "Entregada", descripcion: "El equipo fue entregado." },
  { id: "cancelada", nombre: "Cancelada", descripcion: "La orden fue cancelada." },
];

export function nombreEstado(id) {
  return ESTADOS.find((e) => e.id === id)?.nombre ?? id;
}

function generarNumero() {
  const d = new Date();
  const fecha = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RC-${fecha}-${azar}`;
}

export class Orden {
  constructor(datos) {
    Object.assign(this, datos);
  }

  static crear({ usuario, equipo, servicios, descripcion, contacto, entrega, pago, totales }) {
    const ahora = new Date().toISOString();
    const orden = new Orden({
      id: generarNumero(),
      creada: ahora,
      usuario,       // { id, nombre, email, telefono }
      equipo,        // { marca, marcaId, modelo, modeloSlug, color, capacidad, otro }
      servicios,     // [{ id, nombre, categoria, precio, tiempo }]
      descripcion,
      contacto,      // { nombre, email, telefono }
      entrega,       // { modalidad, direccion, fecha, hora }
      pago,          // { metodo, estado, red?, ultimos4?, titular?, autorizacion? }
      totales,       // { subtotal, recargo, itbis, total }
      estado: "recibida",
      historial: [{ estado: "recibida", fecha: ahora, nota: "Solicitud creada por el cliente." }],
      correo: { taller: "pendiente", cliente: "pendiente" },
    });
    const lista = Almacen.leer(CLAVE_ORDENES, []);
    lista.unshift({ ...orden });
    Almacen.guardar(CLAVE_ORDENES, lista);
    return orden;
  }

  static todas() {
    return Almacen.leer(CLAVE_ORDENES, []).map((o) => new Orden(o));
  }

  static deUsuario(usuarioId) {
    return Orden.todas().filter((o) => o.usuario.id === usuarioId);
  }

  static buscar(id) {
    return Orden.todas().find((o) => o.id === id) ?? null;
  }

  static actualizar(id, cambios) {
    const lista = Almacen.leer(CLAVE_ORDENES, []);
    const i = lista.findIndex((o) => o.id === id);
    if (i === -1) return null;
    lista[i] = { ...lista[i], ...cambios };
    Almacen.guardar(CLAVE_ORDENES, lista);
    return new Orden(lista[i]);
  }

  static cambiarEstado(id, estado, nota = "") {
    const orden = Orden.buscar(id);
    if (!orden) return null;
    const historial = [...orden.historial, { estado, fecha: new Date().toISOString(), nota }];
    const cambios = { estado, historial };
    // Al entregar un equipo pagado en efectivo, el pago queda cobrado.
    if (estado === "entregada" && orden.pago.metodo === "efectivo") {
      cambios.pago = { ...orden.pago, estado: "Pagado en efectivo" };
    }
    return Orden.actualizar(id, cambios);
  }

  get puedeCancelar() {
    return this.estado === "recibida";
  }
}
