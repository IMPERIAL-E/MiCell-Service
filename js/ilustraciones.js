// Ilustraciones SVG de teléfonos generadas a partir de las características de cada modelo.
// No usan fotos de fabricantes: el estilo cambia según el tipo de equipo y el color de su marca.

let contador = 0;

function tipoDeEquipo(modelo) {
  const c = modelo?.caracteristicas ?? {};
  const nombre = modelo?.nombre ?? "";
  if (c.plegable) {
    return /flip|razr|pocket|hero|v flip/i.test(nombre) ? "tapa" : "libro";
  }
  if (c.huella === "boton") return "boton";
  if (c.huella === "faceid") {
    return /iphone (1[5-9]|air|16e)|iphone 14 pro/i.test(nombre) ? "isla" : "notch";
  }
  return "perforacion";
}

function aclarar(hex, cantidad) {
  const n = parseInt(hex.slice(1), 16);
  const canal = (v) => Math.min(255, Math.round(v + (255 - v) * cantidad));
  const r = canal(n >> 16), g = canal((n >> 8) & 255), b = canal(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// La pantalla lleva un fondo de pantalla abstracto recortado a su forma.
function pantalla(id, x, y, w, h, radio, color) {
  return `
    <clipPath id="recorte-${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radio}"/></clipPath>
    <g clip-path="url(#recorte-${id})">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#fondo-${id})"/>
      <circle cx="${x + w * 0.85}" cy="${y + h * 0.2}" r="${w * 0.6}" fill="${aclarar(color, 0.2)}" opacity=".45"/>
      <circle cx="${x + w * 0.1}" cy="${y + h * 0.9}" r="${w * 0.5}" fill="${aclarar(color, 0.5)}" opacity=".25"/>
    </g>`;
}

/**
 * Devuelve el SVG de un teléfono.
 * @param {object|null} modelo  Instancia de Modelo del catálogo (o null para un equipo genérico).
 * @param {string} color        Color de la marca.
 * @param {string} etiqueta     Texto alternativo para lectores de pantalla.
 */
export function svgTelefono(modelo, color = "#475569", etiqueta = "") {
  const id = `tel${++contador}`;
  const tipo = tipoDeEquipo(modelo);
  const marco = "#1f2937";
  const defs = `
    <defs>
      <linearGradient id="fondo-${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="${aclarar(color, 0.15)}"/>
      </linearGradient>
    </defs>`;

  let cuerpo;
  let viewBox = "0 0 120 240";

  switch (tipo) {
    case "libro":
      viewBox = "0 0 200 240";
      cuerpo = `
        <rect x="4" y="10" width="192" height="220" rx="16" fill="${marco}"/>
        ${pantalla(id, 10, 16, 180, 208, 11, color)}
        <line x1="100" y1="16" x2="100" y2="224" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>
        <circle cx="150" cy="26" r="2.6" fill="#0b0b0b"/>`;
      break;
    case "tapa":
      cuerpo = `
        <rect x="14" y="4" width="92" height="232" rx="16" fill="${marco}"/>
        ${pantalla(id, 19, 9, 82, 222, 12, color)}
        <rect x="14" y="116" width="92" height="8" fill="#000" opacity=".35"/>
        <circle cx="60" cy="18" r="2.6" fill="#0b0b0b"/>`;
      break;
    case "boton":
      cuerpo = `
        <rect x="14" y="4" width="92" height="232" rx="18" fill="${aclarar(color, 0.85)}" stroke="#cbd5e1"/>
        ${pantalla(id, 20, 34, 80, 168, 3, color)}
        <rect x="48" y="18" width="24" height="3.5" rx="1.75" fill="#94a3b8"/>
        <circle cx="60" cy="218" r="9" fill="none" stroke="#94a3b8" stroke-width="2"/>`;
      break;
    case "notch":
      cuerpo = `
        <rect x="14" y="4" width="92" height="232" rx="20" fill="${marco}"/>
        ${pantalla(id, 18, 8, 84, 224, 17, color)}
        <path d="M40 8h40v6a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6z" fill="#000"/>`;
      break;
    case "isla":
      cuerpo = `
        <rect x="14" y="4" width="92" height="232" rx="20" fill="${marco}"/>
        ${pantalla(id, 18, 8, 84, 224, 17, color)}
        <rect x="45" y="14" width="30" height="9" rx="4.5" fill="#000"/>`;
      break;
    default:
      cuerpo = `
        <rect x="14" y="4" width="92" height="232" rx="18" fill="${marco}"/>
        ${pantalla(id, 18, 8, 84, 224, 14, color)}
        <circle cx="60" cy="17" r="3.2" fill="#000"/>`;
  }

  const titulo = etiqueta || modelo?.nombreCompleto || "Teléfono";
  return `<svg class="ilustracion-telefono" viewBox="${viewBox}" role="img" aria-label="${titulo.replace(/"/g, "&quot;")}" xmlns="http://www.w3.org/2000/svg">
    ${defs}${cuerpo}
  </svg>`;
}
