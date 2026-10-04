// Utilidades de interfaz compartidas: encabezado con menú de marcas, pie de página,
// formato de dinero y fechas, y avisos (toasts).

import { NEGOCIO, PRECIOS } from "./config.js";
import { Auth } from "./auth.js";
import { catalogo } from "./catalogo.js";
import { icono } from "./iconos.js";

/* ---------- Formato ---------- */

export function escapar(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const formatoDinero = new Intl.NumberFormat("es-DO", { style: "currency", currency: PRECIOS.moneda, maximumFractionDigits: 0 });

export function dinero(valor) {
  return formatoDinero.format(valor).replace("DOP", "RD$");
}

export function fechaCorta(iso) {
  if (!iso) return "—";
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
}

export function fechaLarga(iso, conHora = false) {
  if (!iso) return "—";
  // Las fechas "AAAA-MM-DD" se interpretan como fecha local, no UTC.
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  const opciones = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  if (conHora) Object.assign(opciones, { hour: "numeric", minute: "2-digit" });
  return fecha.toLocaleString("es-DO", opciones);
}

export function iniciales(nombre) {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* ---------- Logos ---------- */

// Logos originales en SVG (assets/logos). El nombre ya acompaña al logo en pantalla,
// por eso el alt va vacío y no se repite en lectores de pantalla.
export function logoMarca(marca, clase = "logo-marca") {
  return `<img class="${clase}" src="assets/logos/marcas/${escapar(marca.id)}.svg" alt="" loading="lazy" decoding="async">`;
}

export const REDES_PAGO = [
  { id: "visa", nombre: "Visa" },
  { id: "mastercard", nombre: "Mastercard" },
  { id: "amex", nombre: "American Express" },
  { id: "discover", nombre: "Discover" },
];

export function logoPago(id, nombre, clase = "logo-pago") {
  return `<img class="${clase}" src="assets/logos/pagos/${escapar(id)}.svg" alt="${escapar(nombre)}" decoding="async">`;
}

/* ---------- Avisos ---------- */

export function aviso(mensaje, tipo = "info") {
  let zona = document.querySelector(".avisos");
  if (!zona) {
    zona = document.createElement("div");
    zona.className = "avisos";
    zona.setAttribute("aria-live", "polite");
    document.body.appendChild(zona);
  }
  const el = document.createElement("div");
  el.className = `aviso aviso--${tipo}`;
  el.textContent = mensaje;
  zona.appendChild(el);
  setTimeout(() => el.classList.add("aviso--saliendo"), 3500);
  setTimeout(() => el.remove(), 4000);
}

/* ---------- Encabezado ---------- */

// "MiCell" con la segunda parte resaltada en el color de la marca.
function htmlNombre() {
  const m = /^(Mi)(.+)$/.exec(NEGOCIO.nombre);
  return `<span>${m ? `${m[1]}<b>${escapar(m[2])}</b>` : escapar(NEGOCIO.nombre)}</span>`;
}

export function enlaceWhatsApp(mensaje = `Hola ${NEGOCIO.nombre}, quiero información sobre una reparación.`) {
  return `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

function enlace(href, texto, activo) {
  return `<a href="${href}" class="nav__enlace${activo ? " nav__enlace--activo" : ""}">${texto}</a>`;
}

function htmlEncabezado(usuario) {
  const pagina = location.pathname.split("/").pop() || "index.html";
  const cuenta = usuario
    ? `<div class="cuenta">
         <button class="cuenta__boton" aria-haspopup="true" aria-expanded="false">
           <span class="avatar">${escapar(iniciales(usuario.nombre))}</span>
           <span class="cuenta__nombre">${escapar(usuario.primerNombre)}</span>
         </button>
         <div class="cuenta__menu" role="menu">
           <p class="cuenta__correo">${escapar(usuario.email)}</p>
           <a href="mis-solicitudes.html" role="menuitem">Mis solicitudes</a>
           ${usuario.esAdmin ? '<a href="admin.html" role="menuitem">Panel de administración</a>' : ""}
           <button type="button" data-accion="cerrar-sesion" role="menuitem">Cerrar sesión</button>
         </div>
       </div>`
    : `<a href="login.html" class="boton boton--secundario boton--chico">Iniciar sesión</a>`;

  return `
    <div class="encabezado__contenido contenedor">
      <a href="index.html" class="logo" aria-label="${escapar(NEGOCIO.nombre)} – inicio">
        <span class="logo__icono">${icono("logo")}</span>${htmlNombre()}
      </a>
      <button class="nav__hamburguesa" aria-label="Abrir menú" aria-expanded="false">${icono("menu")}</button>
      <nav class="nav" aria-label="Principal">
        ${enlace("index.html", "Inicio", pagina === "index.html")}
        <div class="nav__item nav__item--marcas">
          <button class="nav__enlace" aria-haspopup="true" aria-expanded="false">Marcas ${icono("chevron")}</button>
          <div class="mega" role="region" aria-label="Marcas y modelos">
            <div class="mega__buscador">
              <input type="search" class="campo" placeholder="Busca tu modelo, por ejemplo: Galaxy S23" aria-label="Buscar modelo">
              <ul class="mega__resultados"></ul>
            </div>
            <div class="mega__cuerpo">
              <ul class="mega__marcas"></ul>
              <div class="mega__modelos"><p class="mega__vacio">Pasa el mouse sobre una marca para ver sus modelos.</p></div>
            </div>
          </div>
        </div>
        ${enlace("index.html#servicios", "Servicios", false)}
        ${usuario ? enlace("mis-solicitudes.html", "Mis solicitudes", pagina === "mis-solicitudes.html") : ""}
        ${usuario?.esAdmin ? enlace("admin.html", "Administración", pagina === "admin.html") : ""}
        <a href="solicitud.html" class="boton boton--primario boton--chico nav__cta">Solicitar reparación</a>
        ${cuenta}
      </nav>
    </div>`;
}

function enlaceModelo(modelo) {
  return `solicitud.html?marca=${encodeURIComponent(modelo.marcaId)}&modelo=${encodeURIComponent(modelo.slug)}`;
}

function mostrarModelosEnMega(contenedor, marcaId) {
  const marca = catalogo.marca(marcaId);
  if (!marca) return;
  contenedor.innerHTML = `
    <div class="mega__cabecera">
      <strong>${escapar(marca.nombre)}</strong>
      <a href="solicitud.html?marca=${encodeURIComponent(marca.id)}">Ver todos →</a>
    </div>
    <div class="mega__series">
      ${marca.series
        .map(
          (serie) => `
        <div class="mega__serie">
          <h4>${escapar(serie.nombre)}</h4>
          <ul>${serie.modelos.map((m) => `<li><a href="${enlaceModelo(m)}">${escapar(m.nombre)}</a></li>`).join("")}</ul>
        </div>`
        )
        .join("")}
    </div>`;
}

function activarMegaMenu(raiz) {
  const item = raiz.querySelector(".nav__item--marcas");
  const disparador = item.querySelector(":scope > button");
  const listaMarcas = item.querySelector(".mega__marcas");
  const zonaModelos = item.querySelector(".mega__modelos");
  const buscador = item.querySelector(".mega__buscador input");
  const resultados = item.querySelector(".mega__resultados");

  listaMarcas.innerHTML = catalogo.marcas
    .map(
      (m) => `<li><button type="button" data-marca="${m.id}">
        <span class="marca-icono">${logoMarca(m)}</span>${escapar(m.nombre)}
      </button></li>`
    )
    .join("");

  const seleccionar = (boton) => {
    listaMarcas.querySelectorAll("button").forEach((b) => b.classList.toggle("activo", b === boton));
    mostrarModelosEnMega(zonaModelos, boton.dataset.marca);
  };

  // Al pasar el mouse (escritorio), con el teclado (foco) o al tocar (móvil).
  listaMarcas.addEventListener("mouseover", (e) => {
    const boton = e.target.closest("button[data-marca]");
    if (boton && !boton.classList.contains("activo")) seleccionar(boton);
  });
  listaMarcas.addEventListener("focusin", (e) => {
    const boton = e.target.closest("button[data-marca]");
    if (boton) seleccionar(boton);
  });
  listaMarcas.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-marca]");
    if (boton) seleccionar(boton);
  });

  const abrir = (abierto) => {
    item.classList.toggle("abierto", abierto);
    disparador.setAttribute("aria-expanded", String(abierto));
  };
  const conMouse = () => matchMedia("(hover: hover) and (min-width: 961px)").matches;
  // Con mouse se abre al pasar por encima; en pantallas táctiles, al tocar.
  disparador.addEventListener("click", () => abrir(conMouse() || !item.classList.contains("abierto")));
  item.addEventListener("mouseenter", () => conMouse() && abrir(true));
  item.addEventListener("mouseleave", () => conMouse() && abrir(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && abrir(false));
  document.addEventListener("click", (e) => !item.contains(e.target) && abrir(false));

  buscador.addEventListener("input", () => {
    const encontrados = catalogo.buscar(buscador.value, 8);
    resultados.innerHTML = encontrados
      .map((m) => `<li><a href="${enlaceModelo(m)}">${escapar(m.nombreCompleto)} <small>${escapar(m.serie)}</small></a></li>`)
      .join("");
    if (buscador.value.trim().length >= 2 && encontrados.length === 0) {
      resultados.innerHTML = `<li class="mega__sin-resultados">No lo encontramos. <a href="solicitud.html?otro=1">Escríbelo a mano →</a></li>`;
    }
  });

  if (catalogo.marcas.length) seleccionar(listaMarcas.querySelector("button"));
}

function activarMenuCuenta(raiz) {
  const cuenta = raiz.querySelector(".cuenta");
  if (cuenta) {
    const boton = cuenta.querySelector(".cuenta__boton");
    boton.addEventListener("click", () => {
      const abierto = cuenta.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", String(abierto));
    });
    document.addEventListener("click", (e) => !cuenta.contains(e.target) && cuenta.classList.remove("abierto"));
  }
  raiz.querySelector('[data-accion="cerrar-sesion"]')?.addEventListener("click", () => {
    Auth.cerrarSesion();
    location.href = "index.html";
  });

  const hamburguesa = raiz.querySelector(".nav__hamburguesa");
  hamburguesa.addEventListener("click", () => {
    const abierto = raiz.classList.toggle("menu-abierto");
    hamburguesa.setAttribute("aria-expanded", String(abierto));
  });
}

/* ---------- Pie de página ---------- */

// Cada entidad se muestra como una tarjeta con su color institucional y el logo en blanco.
const ENTIDADES = [
  { id: "banreservas", nombre: "Banreservas", fondo: "linear-gradient(135deg, #0a4ea2, #062f66)" },
  { id: "popular", nombre: "Banco Popular", fondo: "linear-gradient(135deg, #1a4f8b, #0b2a52)" },
  { id: "bhd", nombre: "Banco BHD", fondo: "linear-gradient(135deg, #3cae3f, #1f7a2c)" },
  { id: "scotiabank", nombre: "Scotiabank", fondo: "linear-gradient(135deg, #ec111a, #a30c12)" },
  { id: "santacruz", nombre: "Banco Santa Cruz", fondo: "linear-gradient(135deg, #1268b3, #0a3f73)" },
  { id: "apap", nombre: "Asociación Popular (APAP)", fondo: "linear-gradient(135deg, #1d3f8f, #0e2458)" },
  { id: "ademi", nombre: "Banco Ademi", fondo: "linear-gradient(135deg, #10a4b4, #08707d)" },
  { id: "banesco", nombre: "Banesco", fondo: "linear-gradient(135deg, #00843d, #00562a)" },
];

function htmlPie() {
  const anio = new Date().getFullYear();
  return `
    <section class="pagos" aria-label="Métodos de pago aceptados">
      <div class="contenedor">
        <h2 class="pagos__titulo">Métodos de pago aceptados</h2>
        <ul class="pagos__lista">
          ${REDES_PAGO.map((r) => `<li class="etiqueta-pago" title="${r.nombre}">${logoPago(r.id, r.nombre)}</li>`).join("")}
          <li class="etiqueta-pago etiqueta-pago--efectivo" title="Efectivo">${icono("efectivo")}<span>Efectivo</span></li>
        </ul>
        <h3 class="pagos__subtitulo">Tarjetas de débito y crédito de las entidades</h3>
        <ul class="pagos__lista">${ENTIDADES.map((e) => `<li class="entidad" style="background:${e.fondo}" title="${escapar(e.nombre)}">${logoPago(e.id, e.nombre, "entidad__logo")}</li>`).join("")}</ul>
        <p class="pagos__nota">🔒 Los pagos con tarjeta no generan cobros reales y nunca se guardan los datos completos de tu tarjeta.</p>
      </div>
    </section>
    <div class="pie__contenido contenedor">
      <div>
        <p class="logo"><span class="logo__icono">${icono("logo")}</span>${htmlNombre()}</p>
        <p style="margin-top:1rem;max-width:300px">${escapar(NEGOCIO.eslogan)}. Garantía de ${NEGOCIO.garantiaDias} días en todas las reparaciones.</p>
      </div>
      <div>
        <h4>Servicios</h4>
        <ul>
          <li><a href="solicitud.html?categoria=pantalla">Cambio de pantalla</a></li>
          <li><a href="solicitud.html?categoria=bateria">Cambio de batería</a></li>
          <li><a href="solicitud.html?categoria=carga">Puerto de carga</a></li>
          <li><a href="solicitud.html?categoria=liquidos">Daño por líquidos</a></li>
        </ul>
      </div>
      <div>
        <h4>Tu cuenta</h4>
        <ul>
          <li><a href="solicitud.html">Solicitar reparación</a></li>
          <li><a href="mis-solicitudes.html">Mis solicitudes</a></li>
          <li><a href="login.html">Iniciar sesión</a></li>
          <li><a href="creditos.html">Créditos de imágenes</a></li>
        </ul>
      </div>
      <div>
        <h4>Contacto</h4>
        <p>${escapar(NEGOCIO.telefono)}</p>
        <p>${escapar(NEGOCIO.direccion)}</p>
        <p>${escapar(NEGOCIO.horario)}</p>
      </div>
    </div>
    <div class="pie__legal contenedor">
      <span>© ${anio} ${escapar(NEGOCIO.nombre)} · Proyecto personal de desarrollo</span>
      <span>Fotos: Pexels · Rostros de reseñas generados con IA</span>
    </div>`;
}

function htmlWhatsApp() {
  return `<a class="whatsapp-flotante no-imprimir" href="${enlaceWhatsApp()}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
    ${icono("chat")}<span>WhatsApp</span>
  </a>`;
}

// Muestra con un desvanecimiento suave los bloques marcados con .revelar al entrar en pantalla.
export function activarRevelado(raiz = document) {
  const elementos = raiz.querySelectorAll(".revelar:not(.visible)");
  if (!("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.classList.add("visible"));
    return;
  }
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) {
          const el = e.target;
          el.classList.add("visible");
          observador.unobserve(el);
          // Al terminar la entrada se quitan la clase y el retraso escalonado,
          // para que el hover y el press respondan al instante.
          const retraso = parseFloat(getComputedStyle(el).transitionDelay) * 1000 || 0;
          setTimeout(() => {
            el.classList.remove("revelar", "visible");
            el.style.transitionDelay = "";
          }, 650 + retraso);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  elementos.forEach((el) => observador.observe(el));
}

/* ---------- Arranque común de cada página ---------- */

export async function iniciarPagina() {
  await Auth.sembrarCuentasDemo();
  const usuario = Auth.usuarioActual();

  const encabezado = document.querySelector("#encabezado");
  const pie = document.querySelector("#pie");
  if (encabezado) {
    encabezado.innerHTML = htmlEncabezado(usuario);
    activarMenuCuenta(encabezado);
  }
  if (pie) {
    pie.innerHTML = htmlPie();
    document.body.insertAdjacentHTML("beforeend", htmlWhatsApp());
  }

  try {
    await catalogo.cargar();
    if (encabezado) activarMegaMenu(encabezado);
  } catch (error) {
    console.error(error);
    aviso("No se pudo cargar el catálogo. Abre el sitio con un servidor local (Live Server) o desde Vercel.", "error");
  }
  return { usuario, catalogo };
}
