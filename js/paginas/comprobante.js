import { iniciarPagina, escapar, dinero, fechaLarga } from "../ui.js";
import { Auth } from "../auth.js";
import { Orden, ESTADOS, nombreEstado } from "../orden.js";
import { NEGOCIO } from "../config.js";

await iniciarPagina();
const usuario = Auth.exigirSesion();
const params = new URLSearchParams(location.search);
const contenedor = document.querySelector("#comprobante");

const MENSAJES_CORREO = {
  enviado: ["exito", "📧 Enviamos el ticket completo a nuestro equipo por correo."],
  "no configurado": ["aviso", "📧 El envío por correo aún no está configurado (modo demo). Tu orden quedó guardada igualmente."],
  error: ["aviso", "📧 No pudimos enviar el correo en este momento, pero tu orden quedó guardada."],
};

function lineaDeTiempo(orden) {
  const pasos = orden.estado === "cancelada"
    ? [...new Set(orden.historial.map((h) => h.estado))].map((id) => ESTADOS.find((e) => e.id === id))
    : ESTADOS.filter((e) => e.id !== "cancelada");
  return pasos
    .map((e) => {
      const registro = [...orden.historial].reverse().find((h) => h.estado === e.id);
      return `<li class="${registro ? "hecho" : ""}">
        <strong>${escapar(e.nombre)}</strong>
        <small>${registro ? `${fechaLarga(registro.fecha, true)}${registro.nota ? ` · ${escapar(registro.nota)}` : ""}` : escapar(e.descripcion)}</small>
      </li>`;
    })
    .join("");
}

function render(orden) {
  const { equipo, contacto, entrega, pago, totales } = orden;
  const [tipoCorreo, textoCorreo] = MENSAJES_CORREO[orden.correo?.taller] ?? [];
  const extras = [equipo.color, equipo.capacidad].filter(Boolean).join(" · ");

  contenedor.innerHTML = `
    ${params.has("nueva") ? `<div class="alerta alerta--exito no-imprimir"><strong>¡Solicitud creada!</strong> Guarda tu número de orden para darle seguimiento.</div>` : ""}
    ${params.has("nueva") && textoCorreo ? `<div class="alerta alerta--${tipoCorreo} no-imprimir">${textoCorreo}</div>` : ""}

    <article class="tarjeta">
      <div class="comprobante__cabecera">
        <div>
          <p style="margin:0;color:var(--color-texto-suave)">${escapar(NEGOCIO.nombre)} · Orden de reparación</p>
          <p class="comprobante__numero">${escapar(orden.id)}</p>
          <p style="margin:0;color:var(--color-texto-suave)">Creada el ${fechaLarga(orden.creada, true)}</p>
        </div>
        <span class="insignia insignia--${orden.estado}">${escapar(nombreEstado(orden.estado))}</span>
      </div>

      <div class="datos">
        <div>
          <h4>Cliente</h4>
          <p>${escapar(contacto.nombre)}<br>${escapar(contacto.email)}<br>${escapar(contacto.telefono)}</p>
        </div>
        <div>
          <h4>Equipo</h4>
          <p><strong>${escapar(equipo.nombreCompleto)}</strong>${extras ? `<br>${escapar(extras)}` : ""}${equipo.otro ? "<br><small>Modelo escrito por el cliente</small>" : ""}</p>
        </div>
        <div>
          <h4>Entrega</h4>
          <p>${entrega.modalidad === "domicilio" ? `Recogida a domicilio<br>${escapar(entrega.direccion)}` : "En el taller"}<br>${fechaLarga(entrega.fecha)}, ${escapar(entrega.hora)}</p>
        </div>
        <div>
          <h4>Pago</h4>
          <p>${pago.metodo === "tarjeta"
            ? `${escapar(pago.red)} •••• ${escapar(pago.ultimos4)}<br>${escapar(pago.titular)}<br>Autorización: ${escapar(pago.autorizacion)}`
            : "Efectivo"}<br><strong>${escapar(pago.estado)}</strong></p>
        </div>
      </div>

      <h3>Servicios solicitados</h3>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead><tr><th>Servicio</th><th>Tiempo estimado</th><th class="numero">Precio</th></tr></thead>
          <tbody>
            ${orden.servicios.map((s) => `<tr><td>${escapar(s.nombre)}<br><small style="color:var(--color-texto-suave)">${escapar(s.categoria)}</small></td><td>${escapar(s.tiempo)}</td><td class="numero">${dinero(s.precio)}</td></tr>`).join("")}
          </tbody>
          <tfoot>
            <tr><td colspan="2" class="numero">Subtotal</td><td class="numero">${dinero(totales.subtotal)}</td></tr>
            ${totales.recargo ? `<tr><td colspan="2" class="numero">Recogida a domicilio</td><td class="numero">${dinero(totales.recargo)}</td></tr>` : ""}
            <tr><td colspan="2" class="numero">ITBIS (18 %)</td><td class="numero">${dinero(totales.itbis)}</td></tr>
            <tr><td colspan="2" class="numero"><strong>Total estimado</strong></td><td class="numero"><strong>${dinero(totales.total)}</strong></td></tr>
          </tfoot>
        </table>
      </div>

      <h3 style="margin-top:1.5rem">Descripción del problema</h3>
      <p class="descripcion-cliente">${escapar(orden.descripcion)}</p>

      <h3 style="margin-top:1.5rem">Estado de la reparación</h3>
      <ol class="linea-tiempo">${lineaDeTiempo(orden)}</ol>

      <div class="paso__acciones no-imprimir">
        <a href="${usuario.esAdmin ? "admin.html" : "mis-solicitudes.html"}" class="boton boton--fantasma">← ${usuario.esAdmin ? "Panel de administración" : "Mis solicitudes"}</a>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button type="button" class="boton boton--secundario" onclick="window.print()">Imprimir</button>
          <a href="solicitud.html" class="boton boton--primario">Nueva solicitud</a>
        </div>
      </div>
    </article>`;
}

if (usuario) {
  const orden = Orden.buscar(params.get("orden") ?? "");
  // Un cliente solo puede ver sus propias órdenes; el administrador puede ver todas.
  if (!orden || (orden.usuario.id !== usuario.id && !usuario.esAdmin)) {
    contenedor.innerHTML = `<div class="tarjeta vacio"><h2>No encontramos esa orden</h2><p>Verifica el número o revisa tus solicitudes.</p><a class="boton boton--primario" href="mis-solicitudes.html">Ir a mis solicitudes</a></div>`;
  } else {
    render(orden);
  }
}
