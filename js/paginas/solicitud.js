// Asistente de solicitud: equipo → problema → entrega → pago → comprobante.

import { iniciarPagina, aviso, escapar, dinero, logoMarca, logoPago } from "../ui.js";
import { Almacen } from "../almacen.js";
import { Orden } from "../orden.js";
import { ValidadorTarjeta } from "../pago.js";
import { enviarOrden } from "../correo.js";
import { PRECIOS, NEGOCIO } from "../config.js";
import { svgTelefono } from "../ilustraciones.js";
import { icono, ICONO_CATEGORIA } from "../iconos.js";
import { validar, marcarCampo, formatearTelefono } from "../validacion.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const CLAVE_BORRADOR = "borrador";
const ESTADO_INICIAL = {
  paso: 1,
  marcaId: null,
  modeloSlug: null,
  otro: false,
  otroNombre: "",
  color: "",
  capacidad: "",
  servicios: [],
  descripcion: "",
  contacto: { nombre: "", email: "", telefono: "" },
  modalidad: "taller",
  direccion: "",
  fecha: "",
  hora: "",
  metodo: "efectivo",
};

const EJEMPLOS = [
  "Se cayó y la pantalla quedó en negro, pero vibra cuando me llaman.",
  "No carga, o solo carga si muevo el cable.",
  "La batería dura muy poco y se apaga sola con 20 %.",
  "Se mojó y desde entonces no enciende.",
  "En las llamadas no me escuchan bien.",
  "Se quedó en el logo y no pasa de ahí.",
];

const { usuario, catalogo } = await iniciarPagina();
const params = new URLSearchParams(location.search);
let estado = cargarEstado();
// Si se llega desde un problema del inicio (?categoria=pantalla), esa categoría se abre en el paso 2.
estado.categoriaFoco = params.get("categoria") ?? estado.categoriaFoco ?? null;


/* ---------- Estado ---------- */

function cargarEstado() {
  // Si se llega desde el menú de marcas, se empieza una solicitud nueva con ese equipo.
  if (params.has("marca") || params.has("otro")) {
    const marca = catalogo.marca(params.get("marca"));
    const modelo = marca ? catalogo.modelo(marca.id, params.get("modelo")) : null;
    return { ...structuredClone(ESTADO_INICIAL), marcaId: marca?.id ?? null, modeloSlug: modelo?.slug ?? null, otro: params.has("otro") };
  }
  const borrador = Almacen.leer(CLAVE_BORRADOR, null, "sesion");
  if (!borrador) return structuredClone(ESTADO_INICIAL);
  const restaurado = { ...structuredClone(ESTADO_INICIAL), ...borrador };
  if (restaurado.paso > 2 && !usuario) restaurado.paso = 2;
  if (restaurado.paso > 1) aviso("Continuamos con tu solicitud donde la dejaste.");
  return restaurado;
}

function guardar() {
  Almacen.guardar(CLAVE_BORRADOR, estado, "sesion");
}

function marcaActual() {
  return catalogo.marca(estado.marcaId);
}

function modeloActual() {
  return estado.otro ? null : catalogo.modelo(estado.marcaId, estado.modeloSlug);
}

function equipoElegido() {
  return estado.otro ? estado.otroNombre.trim().length >= 2 : Boolean(modeloActual());
}

function nombreEquipo() {
  if (estado.otro) return `${marcaActual()?.nombre ?? ""} ${estado.otroNombre.trim()}`.trim();
  return modeloActual()?.nombreCompleto ?? "";
}

function serviciosElegidos() {
  const modelo = modeloActual();
  return estado.servicios
    .map((id) => catalogo.servicio(id))
    .filter(Boolean)
    .map((s) => ({ id: s.id, nombre: s.nombre, categoria: s.categoria, tiempo: s.tiempo, precio: catalogo.precio(s, modelo) }));
}

function calcularTotales() {
  const subtotal = serviciosElegidos().reduce((t, s) => t + s.precio, 0);
  const recargo = estado.modalidad === "domicilio" ? PRECIOS.recogidaDomicilio : 0;
  const itbis = Math.round((subtotal + recargo) * PRECIOS.itbis);
  return { subtotal, recargo, itbis, total: subtotal + recargo + itbis };
}

// Al cambiar de modelo se quitan los servicios que ya no le aplican.
function depurarServicios() {
  const modelo = modeloActual();
  estado.servicios = estado.servicios.filter((id) => {
    const s = catalogo.servicio(id);
    return s && catalogo.aplica(s, modelo);
  });
}

/* ---------- Navegación entre pasos ---------- */

function irA(paso) {
  estado.paso = paso;
  guardar();
  $$("section.paso").forEach((s) => s.classList.toggle("oculto", Number(s.dataset.paso) !== paso));
  $$(".progreso li").forEach((li) => {
    const n = Number(li.dataset.paso);
    li.classList.toggle("hecho", n < paso);
    li.classList.toggle("actual", n === paso);
    li.toggleAttribute("aria-current", n === paso);
  });
  if (paso === 2) renderServicios();
  if (paso === 3) prepararEntrega();
  if (paso === 4) prepararPago();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validarPaso(paso) {
  if (paso === 1) {
    const error = !estado.marcaId && !estado.otro
      ? "Elige la marca de tu teléfono."
      : !equipoElegido()
        ? estado.otro ? "Escribe el modelo de tu teléfono." : "Elige el modelo de tu teléfono."
        : "";
    $("#error-paso-1").textContent = error;
    if (estado.otro) marcarCampo($("#otro-modelo"), estado.otroNombre.trim().length >= 2 ? null : "Escribe al menos 2 caracteres.");
    return !error;
  }
  if (paso === 2) {
    const sinServicios = estado.servicios.length === 0;
    const descripcionCorta = estado.descripcion.trim().length < 20;
    $("#error-paso-2").textContent = sinServicios ? "Marca al menos un servicio. Si no sabes qué tiene, elige “Diagnóstico general”." : "";
    marcarCampo($("#descripcion"), descripcionCorta ? "Describe el problema con al menos 20 caracteres." : null);
    return !sinServicios && !descripcionCorta;
  }
  if (paso === 3) return validarEntrega();
  return true;
}

function activarNavegacion() {
  $$("[data-siguiente]").forEach((b) =>
    b.addEventListener("click", () => {
      if (!validarPaso(estado.paso)) {
        $(`section[data-paso="${estado.paso}"] [aria-invalid="true"]`)?.focus();
        return;
      }
      // Para pasar a "Entrega" se necesita iniciar sesión; el borrador se conserva.
      if (estado.paso === 2 && !usuario) {
        estado.paso = 3;
        guardar();
        location.href = "login.html?volver=solicitud.html";
        return;
      }
      irA(estado.paso + 1);
    })
  );
  $$("[data-anterior]").forEach((b) => b.addEventListener("click", () => irA(estado.paso - 1)));
}

/* ---------- Paso 1: equipo ---------- */

// Con una marca ya elegida, la cuadrícula se compacta para dejar los modelos a la vista.
let verTodasLasMarcas = false;

function renderMarcas() {
  const marca = marcaActual();
  if (marca && !verTodasLasMarcas) {
    $("#marcas").innerHTML = `
      <div class="marca-elegida">
        <span class="marca-tarjeta marca-tarjeta--estatica seleccionada">
          <span class="marca-tarjeta__logo">${logoMarca(marca)}</span><span class="marca-tarjeta__nombre">${escapar(marca.nombre)}</span>
        </span>
        <button type="button" class="boton boton--secundario boton--chico" data-cambiar-marca>Cambiar marca</button>
      </div>`;
    return;
  }
  $("#marcas").innerHTML = catalogo.marcas
    .map(
      (m) => `<button type="button" class="marca-tarjeta${m.id === estado.marcaId ? " seleccionada" : ""}" data-marca="${m.id}" aria-pressed="${m.id === estado.marcaId}">
        <span class="marca-tarjeta__logo">${logoMarca(m)}</span><span class="marca-tarjeta__nombre">${escapar(m.nombre)}</span>
      </button>`
    )
    .join("");
}

function renderModelos() {
  const marca = marcaActual();
  $("#zona-modelos").classList.toggle("oculto", !marca && !estado.otro);
  $("#titulo-modelos").textContent = marca ? `Modelos de ${marca.nombre}` : "Modelo";
  $("#lista-modelos").innerHTML = marca
    ? marca.series
        .map(
          (serie) => `<h4>${escapar(serie.nombre)}</h4>${serie.modelos
            .map((m) => {
              const sel = !estado.otro && m.slug === estado.modeloSlug;
              return `<button type="button" role="option" data-modelo="${m.slug}" aria-selected="${sel}" class="${sel ? "seleccionado" : ""}">${svgTelefono(m, marca.color, m.nombre)}<span>${escapar(m.nombre)}</span></button>`;
            })
            .join("")}`
        )
        .join("")
    : `<p class="resumen__vacio" style="padding:1rem">Elige una marca arriba para ver sus modelos, o escribe tu modelo a la derecha.</p>`;

  $("#grupo-otro").classList.toggle("oculto", !estado.otro);
  $("#grupo-otro label").textContent = marca ? `Escribe tu modelo de ${marca.nombre}` : "Escribe la marca y el modelo";
  $("#otro-modelo").value = estado.otroNombre;
  $("#btn-otro-modelo").textContent = estado.otro ? "Elegir de la lista" : "Mi modelo no aparece";
  $("#btn-otro-modelo").classList.toggle("oculto", !marca);
  $("#color").value = estado.color;
  $("#capacidad").value = estado.capacidad;
  renderEquipoElegido();
}

function renderEquipoElegido() {
  const visible = equipoElegido();
  $("#equipo-elegido").classList.toggle("oculto", !visible);
  if (!visible) return;
  const modelo = modeloActual();
  $("#equipo-elegido .equipo-elegido__icono").innerHTML = svgTelefono(modelo, marcaActual()?.color, nombreEquipo());
  $("#equipo-elegido-nombre").textContent = nombreEquipo();
  $("#equipo-elegido-detalle").textContent = modelo
    ? `${modelo.serie} · Te mostraremos solo los servicios compatibles con este modelo.`
    : "Modelo escrito a mano · Te mostraremos todos los servicios disponibles.";
}

// Desplaza solo la lista de modelos (no la página) hasta el modelo elegido.
function desplazarAModelo(slug) {
  const lista = $("#lista-modelos");
  const boton = lista.querySelector(`[data-modelo="${slug}"]`);
  if (boton) lista.scrollTop = boton.offsetTop - lista.clientHeight / 2;
}

function elegirModelo(marcaId, slug) {
  estado.marcaId = marcaId;
  estado.modeloSlug = slug;
  estado.otro = false;
  depurarServicios();
  guardar();
  renderMarcas();
  renderModelos();
  renderResumen();
  $("#error-paso-1").textContent = "";
}

function activarPaso1() {
  $("#marcas").addEventListener("click", (e) => {
    if (e.target.closest("[data-cambiar-marca]")) {
      verTodasLasMarcas = true;
      renderMarcas();
      $("#marcas .marca-tarjeta.seleccionada")?.focus();
      return;
    }
    const boton = e.target.closest("[data-marca]");
    if (!boton) return;
    verTodasLasMarcas = false;
    if (boton.dataset.marca === estado.marcaId) {
      renderMarcas();
      return;
    }
    estado.marcaId = boton.dataset.marca;
    estado.modeloSlug = null;
    estado.otro = false;
    guardar();
    renderMarcas();
    renderModelos();
    renderResumen();
    $("#zona-modelos").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("#lista-modelos").addEventListener("click", (e) => {
    const boton = e.target.closest("[data-modelo]");
    if (boton) elegirModelo(estado.marcaId, boton.dataset.modelo);
  });

  $("#btn-otro-modelo").addEventListener("click", () => {
    estado.otro = !estado.otro;
    estado.modeloSlug = null;
    guardar();
    renderModelos();
    renderResumen();
    if (estado.otro) $("#otro-modelo").focus();
  });

  $("#otro-modelo").addEventListener("input", (e) => {
    estado.otroNombre = e.target.value;
    guardar();
    renderEquipoElegido();
    renderResumen();
  });
  $("#color").addEventListener("input", (e) => { estado.color = e.target.value; guardar(); });
  $("#capacidad").addEventListener("change", (e) => { estado.capacidad = e.target.value; guardar(); });

  const buscador = $("#buscar-modelo");
  const resultados = $("#resultados-busqueda");
  buscador.addEventListener("input", () => {
    const encontrados = catalogo.buscar(buscador.value, 8);
    resultados.innerHTML = encontrados
      .map((m) => `<li><a href="#" data-marca="${m.marcaId}" data-modelo="${m.slug}">${escapar(m.nombreCompleto)} <small>${escapar(m.serie)}</small></a></li>`)
      .join("");
    if (buscador.value.trim().length >= 2 && !encontrados.length) {
      resultados.innerHTML = `<li class="mega__sin-resultados">No lo encontramos. Elige la marca y pulsa “Mi modelo no aparece”.</li>`;
    }
  });
  resultados.addEventListener("click", (e) => {
    const enlace = e.target.closest("[data-modelo]");
    if (!enlace) return;
    e.preventDefault();
    buscador.value = "";
    resultados.innerHTML = "";
    elegirModelo(enlace.dataset.marca, enlace.dataset.modelo);
    desplazarAModelo(enlace.dataset.modelo);
  });
}

/* ---------- Paso 2: problema ---------- */

function renderServicios() {
  const modelo = modeloActual();
  $("#nombre-equipo-paso2").textContent = nombreEquipo();
  const categorias = catalogo.categoriasPara(modelo);
  $("#categorias-servicios").innerHTML = categorias
    .map((cat, i) => {
      const elegidos = cat.servicios.filter((s) => estado.servicios.includes(s.id)).length;
      return `
        <details class="categoria-servicios" data-categoria="${cat.id}" ${elegidos || cat.id === estado.categoriaFoco || (i === 0 && !estado.servicios.length && !estado.categoriaFoco) ? "open" : ""}>
          <summary>
            <span class="categoria-servicios__icono">${icono(ICONO_CATEGORIA[cat.id])}</span>
            <span>${escapar(cat.nombre)}<br><small>${escapar(cat.descripcion)}</small></span>
            <span class="contador-categoria${elegidos ? "" : " oculto"}">${elegidos}</span>
          </summary>
          ${cat.servicios
            .map(
              (s) => `
            <label class="servicio-opcion">
              <input type="checkbox" value="${s.id}" ${estado.servicios.includes(s.id) ? "checked" : ""}>
              <span><strong>${escapar(s.nombre)}</strong><p>${escapar(s.descripcion)}</p></span>
              <span class="servicio-opcion__precio">${dinero(catalogo.precio(s, modelo))}<small>${escapar(s.tiempo)}</small></span>
            </label>`
            )
            .join("")}
        </details>`;
    })
    .join("");
  $("#descripcion").value = estado.descripcion;
  $("#contador").textContent = estado.descripcion.length;
}

function activarPaso2() {
  $("#categorias-servicios").addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    const id = e.target.value;
    estado.servicios = e.target.checked ? [...estado.servicios, id] : estado.servicios.filter((x) => x !== id);
    const detalles = e.target.closest("details");
    const contador = detalles.querySelector(".contador-categoria");
    const n = detalles.querySelectorAll("input:checked").length;
    contador.textContent = n;
    contador.classList.toggle("oculto", n === 0);
    $("#error-paso-2").textContent = "";
    guardar();
    renderResumen();
  });

  $("#ejemplos").innerHTML = EJEMPLOS.map((t) => `<button type="button">${escapar(t)}</button>`).join("");
  $("#ejemplos").addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;
    const area = $("#descripcion");
    area.value = (area.value.trim() ? `${area.value.trim()} ` : "") + boton.textContent;
    area.dispatchEvent(new Event("input"));
    area.focus();
  });

  $("#descripcion").addEventListener("input", (e) => {
    estado.descripcion = e.target.value;
    $("#contador").textContent = estado.descripcion.length;
    if (estado.descripcion.trim().length >= 20) marcarCampo(e.target, null);
    guardar();
  });
}

/* ---------- Paso 3: entrega ---------- */

function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function limitesFecha() {
  const min = new Date();
  min.setDate(min.getDate() + 1);
  const max = new Date();
  max.setDate(max.getDate() + 30);
  return { min: fechaISO(min), max: fechaISO(max) };
}

function prepararEntrega() {
  // Se rellenan los datos de la cuenta la primera vez.
  if (usuario) {
    estado.contacto.nombre ||= usuario.nombre;
    estado.contacto.email ||= usuario.email;
    estado.contacto.telefono ||= usuario.telefono;
  }
  $("#contacto-nombre").value = estado.contacto.nombre;
  $("#contacto-email").value = estado.contacto.email;
  $("#contacto-telefono").value = estado.contacto.telefono;
  $(`input[name="modalidad"][value="${estado.modalidad}"]`).checked = true;
  $("#grupo-direccion").classList.toggle("oculto", estado.modalidad !== "domicilio");
  $("#direccion").value = estado.direccion;
  const { min, max } = limitesFecha();
  Object.assign($("#fecha"), { min, max, value: estado.fecha });
  $("#hora").value = estado.hora;
  $("#texto-recargo").textContent = `Lo buscamos y te lo devolvemos (+${dinero(PRECIOS.recogidaDomicilio)}).`;
}

function validarEntrega() {
  const { min, max } = limitesFecha();
  const dia = estado.fecha ? new Date(`${estado.fecha}T12:00:00`).getDay() : null;
  const errorFecha = !estado.fecha
    ? "Elige una fecha."
    : estado.fecha < min || estado.fecha > max
      ? "Elige una fecha entre mañana y los próximos 30 días."
      : dia === 0
        ? "Los domingos no abrimos. Elige otro día."
        : null;

  const resultados = [
    marcarCampo($("#contacto-nombre"), validar.nombre(estado.contacto.nombre)),
    marcarCampo($("#contacto-telefono"), validar.telefono(estado.contacto.telefono)),
    marcarCampo($("#contacto-email"), validar.email(estado.contacto.email)),
    marcarCampo($("#direccion"), estado.modalidad === "domicilio" && estado.direccion.trim().length < 8 ? "Escribe la dirección completa." : null),
    marcarCampo($("#fecha"), errorFecha),
    marcarCampo($("#hora"), estado.hora ? null : "Elige una hora."),
  ];
  return resultados.every(Boolean);
}

function activarPaso3() {
  const enlazar = (selector, asignar) =>
    $(selector).addEventListener("input", (e) => {
      asignar(e.target.value);
      marcarCampo(e.target, null);
      guardar();
    });
  enlazar("#contacto-nombre", (v) => (estado.contacto.nombre = v));
  enlazar("#contacto-email", (v) => (estado.contacto.email = v));
  enlazar("#contacto-telefono", (v) => (estado.contacto.telefono = v));
  enlazar("#direccion", (v) => (estado.direccion = v));
  enlazar("#fecha", (v) => (estado.fecha = v));
  $("#hora").addEventListener("change", (e) => {
    estado.hora = e.target.value;
    marcarCampo(e.target, null);
    guardar();
  });
  $("#contacto-telefono").addEventListener("blur", (e) => {
    if (!validar.telefono(e.target.value)) {
      e.target.value = formatearTelefono(e.target.value);
      estado.contacto.telefono = e.target.value;
      guardar();
    }
  });
  $$('input[name="modalidad"]').forEach((r) =>
    r.addEventListener("change", (e) => {
      estado.modalidad = e.target.value;
      $("#grupo-direccion").classList.toggle("oculto", estado.modalidad !== "domicilio");
      guardar();
      renderResumen();
    })
  );
}

/* ---------- Paso 4: pago ---------- */

const CLASES_RED = { visa: "visa", mastercard: "mastercard", amex: "amex", discover: "discover" };

function prepararPago() {
  $(`input[name="metodo"][value="${estado.metodo}"]`).checked = true;
  $("#form-tarjeta").classList.toggle("oculto", estado.metodo !== "tarjeta");
  actualizarBotonConfirmar();
}

function actualizarBotonConfirmar() {
  const { total } = calcularTotales();
  $("#btn-confirmar").textContent = estado.metodo === "tarjeta" ? `Pagar ${dinero(total)} y confirmar` : "Confirmar solicitud";
}

function actualizarTarjetaVisual() {
  const numero = $("#tarjeta-numero").value;
  const red = ValidadorTarjeta.detectarRed(numero);
  const visual = $("#tarjeta-visual");
  visual.className = `tarjeta-visual${red ? ` tarjeta-visual--${CLASES_RED[red.id]}` : ""}`;
  $("#tv-red").innerHTML = red ? logoPago(red.id, red.nombre, "tarjeta-visual__logo") : "TARJETA";
  $("#tv-numero").textContent = numero || "•••• •••• •••• ••••";
  $("#tv-titular").textContent = $("#tarjeta-titular").value.toUpperCase() || "NOMBRE DEL TITULAR";
  $("#tv-vence").textContent = $("#tarjeta-vence").value || "MM/AA";
  $("#tarjeta-cvv").maxLength = red?.cvv ?? 4;
}

function validarTarjeta() {
  const numero = $("#tarjeta-numero").value;
  return [
    marcarCampo($("#tarjeta-numero"), ValidadorTarjeta.validarNumero(numero)),
    marcarCampo($("#tarjeta-titular"), ValidadorTarjeta.validarTitular($("#tarjeta-titular").value)),
    marcarCampo($("#tarjeta-vence"), ValidadorTarjeta.validarVencimiento($("#tarjeta-vence").value)),
    marcarCampo($("#tarjeta-cvv"), ValidadorTarjeta.validarCVV($("#tarjeta-cvv").value, numero)),
  ].every(Boolean);
}

function activarPaso4() {
  $$('input[name="metodo"]').forEach((r) =>
    r.addEventListener("change", (e) => {
      estado.metodo = e.target.value;
      guardar();
      prepararPago();
    })
  );

  $("#tarjeta-numero").addEventListener("input", (e) => {
    e.target.value = ValidadorTarjeta.formatear(e.target.value);
    marcarCampo(e.target, null);
    actualizarTarjetaVisual();
  });
  $("#tarjeta-titular").addEventListener("input", (e) => {
    marcarCampo(e.target, null);
    actualizarTarjetaVisual();
  });
  $("#tarjeta-vence").addEventListener("input", (e) => {
    let d = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
    e.target.value = d;
    marcarCampo(e.target, null);
    actualizarTarjetaVisual();
  });
  $("#tarjeta-cvv").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    marcarCampo(e.target, null);
  });

  $("#btn-confirmar").addEventListener("click", confirmar);
}

async function confirmar() {
  const boton = $("#btn-confirmar");
  const error = $("#error-paso-4");
  error.textContent = "";

  if (estado.metodo === "tarjeta" && !validarTarjeta()) {
    $('#form-tarjeta [aria-invalid="true"]')?.focus();
    return;
  }
  if (!$("#acepto").checked) {
    error.textContent = "Debes aceptar las condiciones para continuar.";
    return;
  }

  boton.disabled = true;
  boton.innerHTML = `<span class="girando" aria-hidden="true"></span> ${estado.metodo === "tarjeta" ? "Procesando pago…" : "Creando orden…"}`;

  let pago = { metodo: "efectivo", estado: "Pendiente (paga al recoger)" };
  if (estado.metodo === "tarjeta") {
    try {
      pago = await ValidadorTarjeta.procesar({ numero: $("#tarjeta-numero").value, titular: $("#tarjeta-titular").value });
    } catch (e) {
      error.textContent = e.message;
      boton.disabled = false;
      actualizarBotonConfirmar();
      return;
    }
  }

  const marca = marcaActual();
  const modelo = modeloActual();
  const orden = Orden.crear({
    usuario: usuario.publico(),
    equipo: {
      marca: marca?.nombre ?? "No indicada",
      marcaId: marca?.id ?? null,
      modelo: estado.otro ? estado.otroNombre.trim() : modelo.nombre,
      modeloSlug: modelo?.slug ?? null,
      nombreCompleto: nombreEquipo(),
      otro: estado.otro,
      color: estado.color.trim(),
      capacidad: estado.capacidad,
    },
    servicios: serviciosElegidos(),
    descripcion: estado.descripcion.trim(),
    contacto: {
      nombre: estado.contacto.nombre.trim(),
      email: estado.contacto.email.trim().toLowerCase(),
      telefono: formatearTelefono(estado.contacto.telefono),
    },
    entrega: {
      modalidad: estado.modalidad,
      direccion: estado.modalidad === "domicilio" ? estado.direccion.trim() : "",
      fecha: estado.fecha,
      hora: estado.hora,
    },
    pago,
    totales: calcularTotales(),
  });

  Almacen.borrar(CLAVE_BORRADOR, "sesion");
  boton.innerHTML = `<span class="girando" aria-hidden="true"></span> Enviando ticket…`;
  const correo = await enviarOrden(orden);
  Orden.actualizar(orden.id, { correo });

  location.href = `comprobante.html?orden=${encodeURIComponent(orden.id)}&nueva=1`;
}

/* ---------- Resumen lateral ---------- */

function renderResumen() {
  const servicios = serviciosElegidos();
  const totales = calcularTotales();
  const detalles = [estado.color.trim(), estado.capacidad].filter(Boolean).join(" · ");
  $("#resumen-equipo").textContent = equipoElegido() ? nombreEquipo() + (detalles ? ` (${detalles})` : "") : "Aún no eliges un equipo.";
  $("#resumen-servicios").innerHTML = servicios.map((s) => `<li><span>${escapar(s.nombre)}</span><span>${dinero(s.precio)}</span></li>`).join("");
  $("#resumen-vacio").classList.toggle("oculto", servicios.length > 0);
  $("#total-subtotal").textContent = dinero(totales.subtotal);
  $("#dt-recargo").classList.toggle("oculto", !totales.recargo);
  $("#total-recargo").classList.toggle("oculto", !totales.recargo);
  $("#total-recargo").textContent = dinero(totales.recargo);
  $("#total-itbis").textContent = dinero(totales.itbis);
  $("#total-total").textContent = dinero(totales.total);
  if (estado.paso === 4) actualizarBotonConfirmar();
}

/* ---------- Arranque ---------- */

function iniciar() {
  activarNavegacion();
  activarPaso1();
  activarPaso2();
  activarPaso3();
  activarPaso4();
  renderMarcas();
  renderModelos();
  renderResumen();
  $("#resumen-garantia").innerHTML = `${icono("escudo")}<span>Garantía de ${NEGOCIO.garantiaDias} días en piezas y mano de obra</span>`;
  const categoria = catalogo.categorias.find((c) => c.id === params.get("categoria"));
  if (categoria && !equipoElegido()) aviso(`${categoria.nombre}: primero dinos qué teléfono tienes.`);
  // No se puede saltar a un paso sin haber completado los anteriores.
  let paso = estado.paso;
  if (paso > 1 && !equipoElegido()) paso = 1;
  irA(paso);
  if (estado.modeloSlug && paso === 1) desplazarAModelo(estado.modeloSlug);
}

// El arranque va al final para que todas las declaraciones del módulo ya existan.
if (catalogo.marcas.length) iniciar();
