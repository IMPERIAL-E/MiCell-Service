import { iniciarPagina, aviso } from "../ui.js";
import { Auth } from "../auth.js";
import { validar, marcarCampo, formatearTelefono, destinoSeguro } from "../validacion.js";

const parametros = new URLSearchParams(location.search);
const destino = destinoSeguro(parametros.get("volver"));

const { usuario } = await iniciarPagina();
if (usuario) location.replace(destino);

if (parametros.get("volver")?.startsWith("solicitud.html")) {
  document.querySelector("#mensaje-volver").classList.remove("oculto");
}

/* ---------- Pestañas ---------- */

const pestanas = { entrar: document.querySelector("#tab-entrar"), registro: document.querySelector("#tab-registro") };
const formularios = { entrar: document.querySelector("#form-entrar"), registro: document.querySelector("#form-registro") };

function mostrar(cual) {
  for (const clave of Object.keys(pestanas)) {
    const activo = clave === cual;
    pestanas[clave].setAttribute("aria-selected", String(activo));
    formularios[clave].classList.toggle("oculto", !activo);
  }
  formularios[cual].querySelector("input")?.focus();
}

pestanas.entrar.addEventListener("click", () => mostrar("entrar"));
pestanas.registro.addEventListener("click", () => mostrar("registro"));
if (parametros.get("modo") === "registro") mostrar("registro");

function errorFormulario(form, mensaje) {
  const caja = form.querySelector(".error-form");
  caja.textContent = mensaje ?? "";
  caja.classList.toggle("oculto", !mensaje);
}

/* ---------- Iniciar sesión ---------- */

formularios.entrar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const email = form.querySelector("#entrar-email").value;
  const password = form.querySelector("#entrar-password").value;
  if (!email || !password) return errorFormulario(form, "Escribe tu correo y tu contraseña.");
  try {
    const u = await Auth.iniciarSesion(email, password, form.querySelector("#entrar-recordar").checked);
    aviso(`¡Bienvenido, ${u.primerNombre}!`, "exito");
    location.href = destino;
  } catch (error) {
    errorFormulario(form, error.message);
  }
});

/* ---------- Registro ---------- */

const campos = {
  nombre: document.querySelector("#reg-nombre"),
  email: document.querySelector("#reg-email"),
  telefono: document.querySelector("#reg-telefono"),
  password: document.querySelector("#reg-password"),
  password2: document.querySelector("#reg-password2"),
};

const reglas = {
  nombre: () => validar.nombre(campos.nombre.value),
  email: () => validar.email(campos.email.value) ?? (Auth.buscarPorEmail(campos.email.value) ? "Ya existe una cuenta con ese correo." : null),
  telefono: () => validar.telefono(campos.telefono.value),
  password: () => validar.password(campos.password.value),
  password2: () => (campos.password2.value !== campos.password.value ? "Las contraseñas no coinciden." : null),
};

// Valida cada campo al salir de él, para dar retroalimentación inmediata.
for (const [clave, input] of Object.entries(campos)) {
  input.addEventListener("blur", () => input.value && marcarCampo(input, reglas[clave]()));
}

formularios.registro.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const valido = Object.entries(campos).map(([clave, input]) => marcarCampo(input, reglas[clave]())).every(Boolean);
  if (!valido) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  try {
    await Auth.registrar({
      nombre: campos.nombre.value,
      email: campos.email.value,
      telefono: formatearTelefono(campos.telefono.value),
      password: campos.password.value,
    });
    await Auth.iniciarSesion(campos.email.value, campos.password.value, true);
    aviso("Cuenta creada correctamente.", "exito");
    location.href = destino;
  } catch (error) {
    errorFormulario(form, error.message);
  }
});
