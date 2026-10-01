// Utilidades de interfaz compartidas: encabezado con menú de marcas, pie de página,
// formato de dinero y fechas, y avisos (toasts).

import { NEGOCIO, PRECIOS } from "./config.js";
import { Auth } from "./auth.js";
import { catalogo } from "./catalogo.js";

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
        <span class="logo__icono" aria-hidden="true">🔧</span>${escapar(NEGOCIO.nombre)}
      </a>
      <button class="nav__hamburguesa" aria-label="Abrir menú" aria-expanded="false">☰</button>
      <nav class="nav" aria-label="Principal">
        ${enlace("index.html", "Inicio", pagina === "index.html")}
        <div class="nav__item nav__item--marcas">
          <button class="nav__enlace" aria-haspopup="true" aria-expanded="false">Marcas ▾</button>
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
        <span class="marca-punto" style="background:${m.color}"></span>${escapar(m.nombre)}
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

const REDES_PAGO = ["Visa", "Mastercard", "American Express", "Discover", "Efectivo"];
const ENTIDADES = ["Banreservas", "Banco Popular", "BHD", "Scotiabank", "Banco Santa Cruz", "Asociación Popular (APAP)", "Banco Caribe", "Banesco"];

function htmlPie() {
  const anio = new Date().getFullYear();
  return `
    <section class="pagos" aria-label="Métodos de pago aceptados">
      <div class="contenedor">
        <h2 class="pagos__titulo">Métodos de pago aceptados</h2>
        <ul class="pagos__lista">${REDES_PAGO.map((r) => `<li class="etiqueta-pago etiqueta-pago--${r.toLowerCase().replace(/\s+/g, "-")}">${r}</li>`).join("")}</ul>
        <h3 class="pagos__subtitulo">Tarjetas de débito y crédito de las entidades</h3>
        <ul class="pagos__lista pagos__lista--entidades">${ENTIDADES.map((e) => `<li class="etiqueta-pago etiqueta-pago--entidad">${e}</li>`).join("")}</ul>
        <p class="pagos__nota">🔒 Sitio de demostración académica: no se realizan cobros reales ni se guardan datos completos de tarjetas.</p>
      </div>
    </section>
    <div class="pie__contenido contenedor">
      <div>
        <p class="logo"><span class="logo__icono" aria-hidden="true">🔧</span>${escapar(NEGOCIO.nombre)}</p>
        <p>${escapar(NEGOCIO.eslogan)}</p>
      </div>
      <div>
        <h4>Contacto</h4>
        <p>${escapar(NEGOCIO.telefono)}<br>${escapar(NEGOCIO.direccion)}<br>${escapar(NEGOCIO.horario)}</p>
      </div>
      <div>
        <h4>Enlaces</h4>
        <p><a href="solicitud.html">Solicitar reparación</a><br><a href="mis-solicitudes.html">Mis solicitudes</a><br><a href="index.html#servicios">Servicios</a></p>
      </div>
    </div>
    <p class="pie__legal contenedor">© ${anio} ${escapar(NEGOCIO.nombre)} · Proyecto de Interacción Humano-Computadora (IHC)</p>`;
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
  if (pie) pie.innerHTML = htmlPie();

  try {
    await catalogo.cargar();
    if (encabezado) activarMegaMenu(encabezado);
  } catch (error) {
    console.error(error);
    aviso("No se pudo cargar el catálogo. Abre el sitio con un servidor local (Live Server) o desde Vercel.", "error");
  }
  return { usuario, catalogo };
}
