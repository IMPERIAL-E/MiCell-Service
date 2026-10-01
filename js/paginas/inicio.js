import { iniciarPagina, escapar, dinero } from "../ui.js";

const { catalogo } = await iniciarPagina();

if (catalogo.marcas.length) {
  const totalServicios = catalogo.categorias.reduce((t, c) => t + c.servicios.length, 0);
  document.querySelector("#dato-marcas").textContent = catalogo.marcas.length;
  document.querySelector("#dato-modelos").textContent = `+${catalogo.totalModelos().toLocaleString("es-DO")}`;
  document.querySelector("#dato-servicios").textContent = totalServicios;

  document.querySelector("#rejilla-categorias").innerHTML = catalogo.categorias
    .map((cat) => {
      const desde = Math.min(...cat.servicios.map((s) => catalogo.precio(s, null)));
      return `
        <article class="tarjeta categoria-tarjeta">
          <span class="categoria-tarjeta__icono" aria-hidden="true">${cat.icono}</span>
          <h3>${escapar(cat.nombre)}</h3>
          <p>${escapar(cat.descripcion)}</p>
          <small>${cat.servicios.length} servicios · desde ${dinero(desde)}</small>
        </article>`;
    })
    .join("");

  document.querySelector("#rejilla-marcas").innerHTML = catalogo.marcas
    .map(
      (m) => `
        <a class="marca-tarjeta" href="solicitud.html?marca=${encodeURIComponent(m.id)}">
          <span class="marca-tarjeta__logo" style="background:${m.color}">${escapar(m.nombre[0])}</span>
          ${escapar(m.nombre)}
        </a>`
    )
    .join("");
}
