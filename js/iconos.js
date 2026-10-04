// Íconos de línea (24×24, trazo de 1.8) usados en toda la interfaz.

const trazos = {
  logo: '<path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="m14.5 8.5-3 3 1.5 1.5-3 3"/>',
  pantalla: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="m9 8 2.5 3L10 13l3 3.5M13.5 6.5l-1 3 2.5 1"/>',
  bateria: '<rect x="7" y="4" width="10" height="17" rx="2"/><path d="M10 2h4M12.8 8.5 10.5 13h3l-2.3 4.5"/>',
  carga: '<path d="M9 2v5M15 2v5M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v6"/>',
  agua: '<path d="M12 2.8s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  camara: '<path d="M4 8h3l1.6-2.4A1.5 1.5 0 0 1 9.9 5h4.2a1.5 1.5 0 0 1 1.3.6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
  audio: '<path d="M11 5 6.5 9H3.5v6h3L11 19V5ZM15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  candado: '<rect x="5" y="10.5" width="14" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  boton: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M19.5 7v3M4.5 7v2M4.5 11v2"/>',
  carcasa: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><rect x="8.5" y="5" width="4" height="4" rx="1"/>',
  brillo: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
  escudo: '<path d="M12 2.8 4.5 5.6v5.8c0 4.6 3.1 8.3 7.5 9.8 4.4-1.5 7.5-5.2 7.5-9.8V5.6L12 2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  rayo: '<path d="M13 2.5 4.5 13.5H12L11 21.5l8.5-11H12l1-8Z"/>',
  tecnico: '<circle cx="12" cy="7.5" r="4"/><path d="M4 21a8 8 0 0 1 16 0M15 3.5l1.8-1.3"/>',
  efectivo: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  tarjeta: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/>',
  estrella: '<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z" fill="currentColor" stroke="none"/>',
  flechaDer: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  flechaIzq: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  chat: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.3A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.5 9.5c.3 2.6 2.8 5.2 5.6 5.6l1.4-1.4-1.9-1-1 .9c-1-.4-2.2-1.6-2.6-2.6l.9-1-1-1.9-1.4 1.4Z"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
  herramienta: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.6 12.6 21a2.1 2.1 0 0 1-3-3L18 9.6"/><path d="m3 3 6 6M3 9h6V3"/>',
  pedido: '<path d="M7 3h10v18l-2.5-1.8L12 21l-2.5-1.8L7 21V3Z"/><path d="M10 8h4M10 12h4"/>',
};

export function icono(nombre, clase = "") {
  return `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trazos[nombre] ?? trazos.info}</svg>`;
}

// Ícono que representa cada categoría de servicios del catálogo.
export const ICONO_CATEGORIA = {
  pantalla: "pantalla",
  bateria: "bateria",
  carga: "carga",
  camaras: "camara",
  audio: "audio",
  botones: "boton",
  carcasa: "carcasa",
  liquidos: "agua",
  placa: "chip",
  software: "candado",
  mantenimiento: "brillo",
  diagnostico: "lupa",
  extras: "rayo",
};

export function estrellas(cantidad, total = 5) {
  return `<span class="estrellas" aria-label="${cantidad} de ${total} estrellas">${Array.from({ length: total }, (_, i) =>
    icono("estrella", i < cantidad ? "" : "vacia")
  ).join("")}</span>`;
}
