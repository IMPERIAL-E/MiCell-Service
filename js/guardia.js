// Guardia de sesión: se carga en el <head> (script clásico, no módulo) para que,
// si no hay sesión activa, el navegador vaya al inicio de sesión antes de pintar la página.
// Lee la misma clave que Auth ("reparacel:sesion") en sessionStorage o localStorage.
(function () {
  function leer(area) {
    try {
      return JSON.parse(window[area].getItem("reparacel:sesion"));
    } catch (e) {
      return null;
    }
  }
  var sesion = leer("sessionStorage") || leer("localStorage");
  if (!sesion || !sesion.usuarioId || sesion.expira < Date.now()) {
    location.replace("login.html");
  }
})();
