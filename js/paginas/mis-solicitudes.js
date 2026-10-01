import { iniciarPagina, escapar, dinero, fechaLarga, aviso } from "../ui.js";
import { Auth } from "../auth.js";
import { Orden, ESTADOS, nombreEstado } from "../orden.js";

await iniciarPagina();
const usuario = Auth.exigirSesion();
const lista = document.querySelector("#lista-ordenes");
const filtro = document.querySelector("#filtro-estado");

filtro.insertAdjacentHTML("beforeend", ESTADOS.map((e) => `<option value="${e.id}">${e.nombre}</option>`).join(""));

function render() {
  const ordenes = Orden.deUsuario(usuario.id).filter((o) => !filtro.value || o.estado === filtro.value);
  if (!ordenes.length) {
    lista.innerHTML = `<div class="tarjeta vacio">
      <h2>${filtro.value ? "No hay solicitudes con ese estado" : "Aún no tienes solicitudes"}</h2>
      <p>Cuando hagas una solicitud de reparación, aparecerá aquí.</p>
      <a href="solicitud.html" class="boton boton--primario">Solicitar reparación</a>
    </div>`;
    return;
  }
  lista.innerHTML = ordenes
    .map(
      (o) => `
      <article class="tarjeta orden-tarjeta">
        <div>
          <h3>${escapar(o.equipo.nombreCompleto)} <span class="insignia insignia--${o.estado}">${escapar(nombreEstado(o.estado))}</span></h3>
          <p>Orden <strong>${escapar(o.id)}</strong> · ${fechaLarga(o.creada)}</p>
          <p>${o.servicios.map((s) => escapar(s.nombre)).join(", ")}</p>
          <p>Total estimado: <strong>${dinero(o.totales.total)}</strong> · ${o.pago.metodo === "tarjeta" ? `Tarjeta •••• ${escapar(o.pago.ultimos4)}` : "Efectivo"}</p>
        </div>
        <div class="orden-tarjeta__acciones">
          ${o.puedeCancelar ? `<button type="button" class="boton boton--peligro boton--chico" data-cancelar="${escapar(o.id)}">Cancelar</button>` : ""}
          <a href="comprobante.html?orden=${encodeURIComponent(o.id)}" class="boton boton--secundario boton--chico">Ver detalle</a>
        </div>
      </article>`
    )
    .join("");
}

if (usuario) {
  render();
  filtro.addEventListener("change", render);
  lista.addEventListener("click", (e) => {
    const boton = e.target.closest("[data-cancelar]");
    if (!boton) return;
    if (!confirm("¿Seguro que quieres cancelar esta solicitud?")) return;
    Orden.cambiarEstado(boton.dataset.cancelar, "cancelada", "Cancelada por el cliente.");
    aviso("Solicitud cancelada.");
    render();
  });
}
