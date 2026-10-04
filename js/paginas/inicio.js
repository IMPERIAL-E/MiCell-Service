import { iniciarPagina, escapar, dinero, fechaCorta, activarRevelado, enlaceWhatsApp, logoMarca } from "../ui.js";
import { icono, estrellas, ICONO_CATEGORIA } from "../iconos.js";
import { svgTelefono } from "../ilustraciones.js";
import { NEGOCIO } from "../config.js";

const $ = (s) => document.querySelector(s);
const IMG = "assets/img/";

const SLIDES = [
  {
    imagen: "servicios/portada-04.jpg",
    etiqueta: [icono("escudo"), `Garantía de ${NEGOCIO.garantiaDias} días`],
    titulo: "Tu celular como nuevo, sin complicaciones",
    texto: "Elige tu equipo, cuéntanos qué le pasa y recibe tu número de orden al instante. Más de 1,000 modelos de 36 marcas.",
    accion: ["Solicitar reparación", "solicitud.html"],
  },
  {
    imagen: "servicios/pantalla-02.jpg",
    etiqueta: [icono("reloj"), "Listo en 2 a 4 horas"],
    titulo: "¿Pantalla rota? Te la cambiamos hoy",
    texto: "Pantallas originales/OLED o Incell, para que elijas la calidad y el precio que te convienen.",
    accion: ["Cotizar mi pantalla", "solicitud.html?categoria=pantalla"],
  },
  {
    imagen: "servicios/bateria-03.jpg",
    etiqueta: [icono("bateria"), "Baterías de alta capacidad"],
    titulo: "Batería nueva, días enteros de carga",
    texto: "Si se descarga rápido, se apaga sola o está inflada, la cambiamos con prueba de salud incluida.",
    accion: ["Cambiar mi batería", "solicitud.html?categoria=bateria"],
  },
  {
    imagen: "servicios/liquidos-02.jpg",
    etiqueta: [icono("agua"), "Limpieza ultrasónica"],
    titulo: "¿Se mojó? Lo rescatamos",
    texto: "Desarme completo, limpieza ultrasónica y tratamiento anticorrosión para recuperar tu equipo y tus fotos.",
    accion: ["Rescatar mi equipo", "solicitud.html?categoria=liquidos"],
  },
  {
    imagen: "servicios/placa-01.jpg",
    etiqueta: [icono("chip"), "Microelectrónica avanzada"],
    titulo: "Reparamos lo que otros no pueden",
    texto: "Microsoldadura, IC de carga, señal y equipos que no encienden. Diagnóstico con informe detallado.",
    accion: ["Pedir diagnóstico", "solicitud.html?categoria=diagnostico"],
  },
];

const CONFIANZA = [
  ["escudo", `Garantía de ${NEGOCIO.garantiaDias} días`, "En piezas y mano de obra"],
  ["rayo", "Servicio express", "Muchas reparaciones el mismo día"],
  ["tecnico", "Técnicos certificados", "Experiencia en todas las marcas"],
  ["tarjeta", "Pago seguro", "Tarjeta o efectivo al recoger"],
];

const PROBLEMAS = [
  ["pantalla", "Pantalla rota", "Cristal roto, líneas, manchas o en negro."],
  ["bateria", "Batería", "Se descarga rápido o se apaga sola."],
  ["carga", "No carga", "Hay que mover el cable o no carga nada."],
  ["liquidos", "Se mojó", "Cayó al agua o se derramó un líquido."],
  ["camaras", "Cámara", "Fotos borrosas o cámara en negro."],
  ["audio", "Audio y micrófono", "No se escucha o no te escuchan."],
  ["software", "Bloqueo y software", "Se reinicia, se quedó en el logo o virus."],
  ["diagnostico", "No sé qué tiene", "Lo revisamos completo con informe."],
];

const SERVICIOS_FOTO = [
  ["pantalla", "servicios/pantalla-01.jpg"],
  ["bateria", "servicios/bateria-02.jpg"],
  ["carga", "servicios/carga-02.jpg"],
  ["liquidos", "servicios/liquidos-03.jpg"],
  ["placa", "servicios/placa-03.jpg"],
  ["software", "servicios/software-01.jpg"],
];

const EQUIPOS = [
  { titulo: "iPhone", texto: "Del iPhone 6 al iPhone 17 Pro Max", etiquetas: ["Pantalla", "Batería", "Face ID"], imagen: "equipos/iphone-01.jpg", enlace: "solicitud.html?marca=apple", mitad: true },
  { titulo: "Samsung Galaxy", texto: "Series S, A, Note, M y Z", etiquetas: ["Pantalla", "Puerto"], imagen: "equipos/samsung-03.jpg", enlace: "solicitud.html?marca=samsung" },
  { titulo: "Google Pixel", texto: "Del Pixel original al Pixel 10", etiquetas: ["Cámara", "Batería"], imagen: "equipos/pixel-01.jpg", enlace: "solicitud.html?marca=google" },
  { titulo: "Xiaomi, Redmi y POCO", texto: "Toda la familia Xiaomi", etiquetas: ["Pantalla", "Software"], imagen: "equipos/xiaomi-01.jpg", enlace: "solicitud.html?marca=xiaomi" },
  { titulo: "Plegables", texto: "Galaxy Z, razr, Pixel Fold y más", etiquetas: ["Bisagra", "Pantalla interna"], imagen: "equipos/plegable-01.jpg", enlace: "solicitud.html?marca=samsung" },
  { titulo: "Todas las marcas Android", texto: "Motorola, Huawei, Honor, Oppo, Vivo, Tecno y 25 más", etiquetas: ["36 marcas", "+1,100 modelos"], imagen: "equipos/varios-01.jpg", enlace: "solicitud.html", mitad: true },
];

const { catalogo } = await iniciarPagina();

renderCarrusel();
$("#confianza").innerHTML = CONFIANZA.map(
  ([ic, titulo, texto]) => `<div class="confianza__item"><span class="confianza__icono">${icono(ic)}</span><div><strong>${titulo}</strong><span>${texto}</span></div></div>`
).join("");
$("#enlace-todos-servicios").insertAdjacentHTML("beforeend", icono("flechaDer"));
$("#cta-acciones").innerHTML = `
  <a class="boton boton--grande" style="background:#fff;color:var(--tinta)" href="solicitud.html">Solicitar reparación ${icono("flechaDer")}</a>
  <a class="boton boton--grande boton--claro" href="${enlaceWhatsApp()}" target="_blank" rel="noopener">${icono("chat")} WhatsApp</a>`;

if (catalogo.marcas.length) {
  $("#dato-marcas").textContent = catalogo.marcas.length;
  $("#dato-modelos").textContent = catalogo.totalModelos().toLocaleString("es-DO");
  renderProblemas();
  renderServicios();
  renderEquipos();
  renderMarcas();
}
await renderResenas();
activarRevelado();

/* ---------- Carrusel ---------- */

function renderCarrusel() {
  const ventana = $("#carrusel");
  const carrusel = ventana.parentElement;
  ventana.innerHTML = `
    ${SLIDES.map(
      (s, i) => `
      <article class="carrusel__slide${i === 0 ? " activo" : ""}" aria-roledescription="diapositiva" aria-label="${i + 1} de ${SLIDES.length}" ${i ? 'aria-hidden="true"' : ""}>
        <img src="${IMG}${s.imagen}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
        <div class="carrusel__contenido">
          <span class="carrusel__etiqueta">${s.etiqueta[0]}${s.etiqueta[1]}</span>
          <h${i === 0 ? 1 : 2} class="carrusel__titulo">${s.titulo}</h${i === 0 ? 1 : 2}>
          <p class="carrusel__texto">${s.texto}</p>
          <div class="carrusel__acciones">
            <a class="boton boton--primario boton--grande" href="${s.accion[1]}" ${i ? 'tabindex="-1"' : ""}>${s.accion[0]} ${icono("flechaDer")}</a>
            <a class="boton boton--claro boton--grande" href="#servicios" ${i ? 'tabindex="-1"' : ""}>Ver servicios</a>
          </div>
        </div>
      </article>`
    ).join("")}
    <button type="button" class="carrusel__flecha carrusel__flecha--anterior" aria-label="Anterior">${icono("flechaIzq")}</button>
    <button type="button" class="carrusel__flecha carrusel__flecha--siguiente" aria-label="Siguiente">${icono("flechaDer")}</button>
    <div class="carrusel__controles">${SLIDES.map((_, i) => `<button type="button" class="carrusel__punto${i === 0 ? " activo" : ""}" aria-label="Ir a la diapositiva ${i + 1}"><span></span></button>`).join("")}</div>`;

  const slides = [...ventana.querySelectorAll(".carrusel__slide")];
  const puntos = [...ventana.querySelectorAll(".carrusel__punto")];
  const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURACION = 6000;
  let actual = 0;
  let temporizador = null;
  let inicio = 0;
  let restante = DURACION;

  const ir = (n) => {
    actual = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const activo = i === actual;
      s.classList.toggle("activo", activo);
      s.toggleAttribute("aria-hidden", !activo);
      s.querySelectorAll("a").forEach((a) => (activo ? a.removeAttribute("tabindex") : a.setAttribute("tabindex", "-1")));
    });
    puntos.forEach((p, i) => {
      p.classList.remove("activo");
      p.classList.toggle("visto", i < actual);
    });
    // Reinicia la animación de la barra activa.
    void puntos[actual].offsetWidth;
    puntos[actual].classList.add("activo");
    programar(DURACION);
  };

  const programar = (ms) => {
    clearTimeout(temporizador);
    if (reducido) return;
    restante = ms;
    inicio = Date.now();
    temporizador = setTimeout(() => ir(actual + 1), ms);
  };

  const pausar = () => {
    if (carrusel.classList.contains("pausado") || reducido) return;
    carrusel.classList.add("pausado");
    clearTimeout(temporizador);
    restante -= Date.now() - inicio;
  };

  const reanudar = () => {
    if (!carrusel.classList.contains("pausado")) return;
    carrusel.classList.remove("pausado");
    programar(Math.max(restante, 400));
  };

  carrusel.style.setProperty("--duracion-slide", `${DURACION}ms`);
  if (reducido) carrusel.classList.add("pausado");
  ventana.querySelector(".carrusel__flecha--anterior").addEventListener("click", () => ir(actual - 1));
  ventana.querySelector(".carrusel__flecha--siguiente").addEventListener("click", () => ir(actual + 1));
  puntos.forEach((p, i) => p.addEventListener("click", () => ir(i)));
  ventana.addEventListener("mouseenter", pausar);
  ventana.addEventListener("mouseleave", reanudar);
  ventana.addEventListener("focusin", pausar);
  ventana.addEventListener("focusout", reanudar);
  document.addEventListener("visibilitychange", () => (document.hidden ? pausar() : reanudar()));

  // Deslizar con el dedo en pantallas táctiles.
  let xInicial = null;
  ventana.addEventListener("touchstart", (e) => (xInicial = e.touches[0].clientX), { passive: true });
  ventana.addEventListener("touchend", (e) => {
    if (xInicial === null) return;
    const dx = e.changedTouches[0].clientX - xInicial;
    if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1));
    xInicial = null;
  });

  programar(DURACION);
}

/* ---------- Secciones ---------- */

function desdeCategoria(id) {
  const cat = catalogo.categorias.find((c) => c.id === id);
  return cat ? Math.min(...cat.servicios.map((s) => catalogo.precio(s, null))) : 0;
}

function renderProblemas() {
  $("#problemas").innerHTML = PROBLEMAS.map(
    ([id, titulo, texto], i) => `
    <a class="problema revelar" style="transition-delay:${i * 40}ms" href="solicitud.html?categoria=${id}">
      <span class="problema__icono">${icono(ICONO_CATEGORIA[id])}</span>
      <strong>${titulo}</strong>
      <p>${texto}</p>
      <span class="problema__desde">Desde ${dinero(desdeCategoria(id))}</span>
    </a>`
  ).join("");
}

function renderServicios() {
  $("#rejilla-servicios").innerHTML = SERVICIOS_FOTO.map(([id, foto], i) => {
    const cat = catalogo.categorias.find((c) => c.id === id);
    return `
      <a class="servicio-foto revelar" style="transition-delay:${(i % 3) * 60}ms" href="solicitud.html?categoria=${id}">
        <div class="servicio-foto__imagen">
          <img src="${IMG}${foto}" alt="" loading="lazy">
          <span class="servicio-foto__icono">${icono(ICONO_CATEGORIA[id])}</span>
        </div>
        <div class="servicio-foto__cuerpo">
          <h3>${escapar(cat.nombre)}</h3>
          <p>${escapar(cat.descripcion)}</p>
          <div class="servicio-foto__pie"><span>${cat.servicios.length} servicios</span><strong>Desde ${dinero(desdeCategoria(id))}</strong></div>
        </div>
      </a>`;
  }).join("");
}

function renderEquipos() {
  $("#equipos").innerHTML = EQUIPOS.map(
    (e, i) => `
    <a class="equipo revelar${e.mitad ? " equipo--mitad" : ""}" style="transition-delay:${(i % 4) * 50}ms" href="${e.enlace}">
      <div class="equipo__imagen"><img src="${IMG}${e.imagen}" alt="${escapar(e.titulo)}" loading="lazy"></div>
      <div class="equipo__info">
        <h3>${escapar(e.titulo)}</h3>
        <p>${escapar(e.texto)}</p>
        <div class="equipo__etiquetas">${e.etiquetas.map((t) => `<span>${escapar(t)}</span>`).join("")}</div>
        <span class="enlace-flecha">Elegir modelo ${icono("flechaDer")}</span>
      </div>
    </a>`
  ).join("");
}

function renderMarcas() {
  $("#rejilla-marcas").innerHTML = catalogo.marcas
    .map(
      (m) => `
      <a class="marca-tarjeta" href="solicitud.html?marca=${encodeURIComponent(m.id)}">
        <span class="marca-tarjeta__logo">${logoMarca(m)}</span><span class="marca-tarjeta__nombre">${escapar(m.nombre)}</span>
      </a>`
    )
    .join("");
}

async function renderResenas() {
  let resenas = [];
  try {
    resenas = (await (await fetch("data/resenas.json")).json()).resenas;
  } catch {
    return;
  }
  const promedio = resenas.reduce((t, r) => t + r.estrellas, 0) / resenas.length;
  $("#resenas-resumen").innerHTML = `
    <span class="resenas__nota">${promedio.toFixed(1)}</span>
    <div>
      ${estrellas(Math.round(promedio))}
      <div class="resenas__nota-detalle">Basado en ${resenas.length} reseñas</div>
      <span class="resenas__aviso">${icono("info")} Reseñas ilustrativas · rostros generados con IA</span>
    </div>`;

  $("#resenas").innerHTML = resenas
    .map((r) => {
      const marca = catalogo.marca(r.marcaId);
      const modelo = marca ? catalogo.modelos(marca.id).find((m) => m.nombre === r.modelo) : null;
      return `
      <article class="resena">
        <div class="resena__cabecera">
          <img class="resena__foto" src="${r.foto}" alt="" loading="lazy" width="52" height="52">
          <div>
            <span class="resena__nombre">${escapar(r.nombre)}</span>
            <span class="resena__fecha">${fechaCorta(r.fecha)}</span>
          </div>
        </div>
        ${estrellas(r.estrellas)}
        <p class="resena__texto">${escapar(r.comentario)}</p>
        <div class="resena__equipo">
          ${svgTelefono(modelo, marca?.color, r.modelo)}
          <div><strong>${escapar(modelo?.nombreCompleto ?? r.modelo)}</strong><span>${escapar(r.servicio)}</span></div>
        </div>
      </article>`;
    })
    .join("");

  // Navegación del carrusel de reseñas con desplazamiento nativo (scroll-snap).
  const pista = $("#resenas");
  const anterior = $("#resenas-anterior");
  const siguiente = $("#resenas-siguiente");
  anterior.innerHTML = icono("flechaIzq");
  siguiente.innerHTML = icono("flechaDer");
  const paso = () => pista.querySelector(".resena").getBoundingClientRect().width + 20;
  const actualizar = () => {
    anterior.disabled = pista.scrollLeft < 8;
    siguiente.disabled = pista.scrollLeft + pista.clientWidth > pista.scrollWidth - 8;
  };
  anterior.addEventListener("click", () => pista.scrollBy({ left: -paso(), behavior: "smooth" }));
  siguiente.addEventListener("click", () => pista.scrollBy({ left: paso(), behavior: "smooth" }));
  pista.addEventListener("scroll", actualizar, { passive: true });
  addEventListener("resize", actualizar);
  actualizar();
}
