import { iniciarPagina, escapar } from "../ui.js";

await iniciarPagina();

try {
  const { fotos } = await (await fetch("data/fotos.json")).json();
  document.querySelector("#creditos").innerHTML = fotos
    .map(
      (f) => `
      <figure class="credito">
        <img src="${escapar(f.archivo)}" alt="${escapar(f.descripcion)}" loading="lazy" width="${f.ancho}" height="${f.alto}">
        <p>Foto de <a href="${escapar(f.perfil_autor)}" target="_blank" rel="noopener">${escapar(f.autor)}</a> en <a href="${escapar(f.fuente)}" target="_blank" rel="noopener">Pexels</a></p>
      </figure>`
    )
    .join("");
} catch {
  document.querySelector("#creditos").textContent = "No se pudieron cargar los créditos.";
}
