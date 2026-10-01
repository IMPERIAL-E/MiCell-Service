// Validaciones de formularios compartidas. Cada función devuelve un mensaje de error o null.

export const validar = {
  nombre(valor) {
    const v = valor.trim();
    if (v.length < 3) return "Escribe tu nombre completo.";
    if (!/^[a-zA-ZÀ-ÿñÑ .'-]+$/.test(v)) return "El nombre solo puede tener letras y espacios.";
    return null;
  },

  email(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim()) ? null : "Escribe un correo válido, por ejemplo: nombre@correo.com";
  },

  // Teléfonos de República Dominicana: 809, 829 u 849 + 7 dígitos.
  telefono(valor) {
    let d = valor.replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
    if (d.length !== 10) return "El teléfono debe tener 10 dígitos, por ejemplo: 809-555-0000";
    if (!/^8[024]9/.test(d)) return "El teléfono debe empezar con 809, 829 u 849.";
    return null;
  },

  password(valor) {
    if (valor.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (!/[a-zA-Z]/.test(valor) || !/\d/.test(valor)) return "Incluye al menos una letra y un número.";
    return null;
  },
};

export function formatearTelefono(valor) {
  let d = valor.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : valor.trim();
}

// Muestra u oculta el error de un campo dentro de su .grupo.
export function marcarCampo(input, mensaje) {
  const error = input.closest(".grupo")?.querySelector(".error");
  input.setAttribute("aria-invalid", mensaje ? "true" : "false");
  if (error) error.textContent = mensaje ?? "";
  return !mensaje;
}

// Solo permite volver a páginas internas del sitio (evita redirecciones a otros dominios).
export function destinoSeguro(valor, porDefecto = "index.html") {
  return valor && /^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(valor) ? valor : porDefecto;
}
