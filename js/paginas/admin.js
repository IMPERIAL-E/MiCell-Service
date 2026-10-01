import { iniciarPagina, escapar, dinero, fechaLarga, aviso } from "../ui.js";
import { Auth } from "../auth.js";
import { Orden, ESTADOS } from "../orden.js";

await iniciarPagina();
const usuario = Auth.exigirSesion({ soloAdmin: true });
const tabla = document.querySelector("#tabla-ordenes");
const filtro = document.querySelector("#filtro-estado");
const buscar = document.querySelector("#buscar");

filtro.insertAdjacentHTML("beforeend", ESTADOS.map((e) => `<option value="${e.id}">${e.nombre}</option>`).join(""));

function renderEstadisticas(ordenes) {
  const activas = ordenes.filter((o) => !["entregada", "cancelada"].includes(o.estado)).length;
  const ingresos = ordenes.filter((o) => o.estado !== "cancelada").reduce((t, o) => t + o.totales.total, 0);
  const tarjeta = ordenes.filter((o) => o.pago.metodo === "tarjeta").length;
  const datos = [
    ["Órdenes totales", ordenes.length],
    ["En proceso", activas],
    ["Listas para entregar", ordenes.filter((o) => o.estado === "lista").length],
    ["Pagadas con tarjeta", tarjeta],
    ["Ingresos estimados", dinero(ingresos)],
  ];
  document.querySelector("#estadisticas").innerHTML = datos
    .map(([titulo, valor]) => `<div class="tarjeta estadistica"><span>${titulo}</span><strong>${valor}</strong></div>`)
    .join("");
}

function render() {
  const todas = Orden.todas();
  renderEstadisticas(todas);
  const q = buscar.value.trim().toLowerCase();
  const ordenes = todas.filter(
    (o) =>
      (!filtro.value || o.estado === filtro.value) &&
      (!q || [o.id, o.contacto.nombre, o.contacto.email, o.equipo.nombreCompleto].some((t) => t.toLowerCase().includes(q)))
  );

  if (!ordenes.length) {
    tabla.innerHTML = `<tr><td colspan="8" class="vacio">No hay órdenes que coincidan.</td></tr>`;
    return;
  }

  tabla.innerHTML = ordenes
    .map(
      (o) => `
      <tr>
        <td><strong>${escapar(o.id)}</strong><br><small>${fechaLarga(o.creada, true)}</small></td>
        <td>${escapar(o.contacto.nombre)}<br><small>${escapar(o.contacto.telefono)}</small></td>
        <td>${escapar(o.equipo.nombreCompleto)}<br><small>${o.servicios.length} servicio(s)</small></td>
        <td>${o.entrega.modalidad === "domicilio" ? "Domicilio" : "Taller"}<br><small>${escapar(o.entrega.fecha)} ${escapar(o.entrega.hora)}</small></td>
        <td>${o.pago.metodo === "tarjeta" ? `${escapar(o.pago.red)} •••• ${escapar(o.pago.ultimos4)}` : "Efectivo"}<br><small>${escapar(o.pago.estado)}</small></td>
        <td class="numero">${dinero(o.totales.total)}</td>
        <td>
          <label class="solo-lectores" for="estado-${escapar(o.id)}">Estado de ${escapar(o.id)}</label>
          <select class="campo" id="estado-${escapar(o.id)}" data-orden="${escapar(o.id)}">
            ${ESTADOS.map((e) => `<option value="${e.id}" ${e.id === o.estado ? "selected" : ""}>${e.nombre}</option>`).join("")}
          </select>
        </td>
        <td><a href="comprobante.html?orden=${encodeURIComponent(o.id)}" class="boton boton--secundario boton--chico">Ver</a></td>
      </tr>`
    )
    .join("");
}

if (usuario) {
  render();
  filtro.addEventListener("change", render);
  buscar.addEventListener("input", render);
  tabla.addEventListener("change", (e) => {
    const select = e.target.closest("[data-orden]");
    if (!select) return;
    const nombre = ESTADOS.find((x) => x.id === select.value).nombre;
    Orden.cambiarEstado(select.dataset.orden, select.value, `Actualizado por ${usuario.nombre}.`);
    aviso(`Orden ${select.dataset.orden}: ${nombre}`, "exito");
    render();
  });
}
