// Script clásico (no módulo): si el sitio se abre con doble clic (file://), el navegador
// bloquea los módulos de JavaScript y la página quedaría en blanco. Aquí se explica qué hacer.
if (location.protocol === "file:") {
  document.addEventListener("DOMContentLoaded", function () {
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div class="aviso-archivo" role="alert"><strong>Abriste el archivo directamente.</strong> ' +
        "Para que la página funcione, ábrela con un servidor local: en VS Code, clic derecho en " +
        "<code>index.html</code> → <code>Open with Live Server</code>. También funciona publicada en Vercel.</div>"
    );
  });
}
