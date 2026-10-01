// Envío del ticket por correo mediante EmailJS (sin servidor propio).

import { EMAILJS, NEGOCIO } from "./config.js";
import { dinero, fechaLarga, escapar } from "./ui.js";

export function correoConfigurado() {
  return Boolean(EMAILJS.publicKey && EMAILJS.serviceId && EMAILJS.templateIdTaller);
}

function textoPago(pago) {
  return pago.metodo === "tarjeta"
    ? `Tarjeta ${pago.red} terminada en ${pago.ultimos4} (autorización ${pago.autorizacion})`
    : "Efectivo (paga al recoger el equipo)";
}

// Variables que recibe la plantilla de EmailJS ({{orden_id}}, {{{servicios_html}}}, etc.).
export function parametrosCorreo(orden) {
  const { equipo, contacto, entrega, pago, totales } = orden;
  const filas = orden.servicios
    .map((s) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapar(s.nombre)}<br><small style="color:#666">${escapar(s.categoria)} · ${escapar(s.tiempo)}</small></td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${dinero(s.precio)}</td></tr>`)
    .join("");

  return {
    negocio_nombre: NEGOCIO.nombre,
    orden_id: orden.id,
    fecha_creacion: fechaLarga(orden.creada, true),
    estado: "Recibida",
    usuario_cuenta: `${orden.usuario.nombre} <${orden.usuario.email}>`,
    cliente_nombre: contacto.nombre,
    cliente_email: contacto.email,
    cliente_telefono: contacto.telefono,
    reply_to: contacto.email,
    marca: equipo.marca,
    modelo: equipo.modelo,
    color: equipo.color || "No indicado",
    capacidad: equipo.capacidad || "No indicada",
    servicios_texto: orden.servicios.map((s) => `• ${s.nombre} — ${dinero(s.precio)}`).join("\n"),
    servicios_html: `<table style="width:100%;border-collapse:collapse">${filas}</table>`,
    descripcion: orden.descripcion,
    modalidad: entrega.modalidad === "domicilio" ? "Recogida y entrega a domicilio" : "Lo lleva el cliente al taller",
    direccion: entrega.direccion || "—",
    fecha_preferida: fechaLarga(entrega.fecha),
    hora_preferida: entrega.hora,
    metodo_pago: textoPago(pago),
    estado_pago: pago.estado,
    subtotal: dinero(totales.subtotal),
    recargo: dinero(totales.recargo),
    itbis: dinero(totales.itbis),
    total: dinero(totales.total),
  };
}

let sdkListo = null;

function cargarSdk() {
  sdkListo ??= new Promise((resolve, reject) => {
    if (window.emailjs) return resolve(window.emailjs);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.onload = () => {
      window.emailjs.init({ publicKey: EMAILJS.publicKey });
      resolve(window.emailjs);
    };
    script.onerror = () => reject(new Error("No se pudo cargar EmailJS."));
    document.head.appendChild(script);
  });
  return sdkListo;
}

// Devuelve { taller, cliente } con "enviado", "error" o "no configurado".
export async function enviarOrden(orden) {
  if (!correoConfigurado()) return { taller: "no configurado", cliente: "no configurado" };

  const resultado = { taller: "error", cliente: EMAILJS.templateIdCliente ? "error" : "no configurado" };
  try {
    const emailjs = await cargarSdk();
    const params = parametrosCorreo(orden);
    await emailjs.send(EMAILJS.serviceId, EMAILJS.templateIdTaller, params);
    resultado.taller = "enviado";
    if (EMAILJS.templateIdCliente) {
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateIdCliente, { ...params, to_email: orden.contacto.email });
      resultado.cliente = "enviado";
    }
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
  return resultado;
}
