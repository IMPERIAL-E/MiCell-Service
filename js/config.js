// Configuración general del sitio. Cambia aquí el nombre del taller y los datos de EmailJS.

export const NEGOCIO = {
  nombre: "ReparaCel",
  eslogan: "Reparación de celulares de todas las marcas",
  telefono: "(809) 555-0123",
  direccion: "Av. Principal #100, Santo Domingo, República Dominicana",
  horario: "Lunes a sábado, 8:00 a. m. – 6:00 p. m.",
};

// EmailJS: https://www.emailjs.com
// Los tres valores son públicos por diseño (van en el navegador). Tu correo
// personal se configura en el panel de EmailJS, nunca aquí.
// Mientras estén vacíos, el sitio funciona igual pero no envía correos.
export const EMAILJS = {
  publicKey: "",
  serviceId: "",
  templateIdTaller: "",   // plantilla que te llega a ti con el ticket completo
  templateIdCliente: "",  // opcional: copia de confirmación para el cliente
};

export const PRECIOS = {
  moneda: "DOP",
  itbis: 0.18,            // impuesto sobre la venta en RD
  recogidaDomicilio: 300, // cargo por recoger y entregar el equipo
};

// Cuentas de demostración que se crean automáticamente la primera vez.
export const CUENTAS_DEMO = [
  { nombre: "Administrador", email: "admin@reparacel.demo", telefono: "8095550100", password: "Admin123", rol: "admin" },
  { nombre: "Cliente Demo", email: "demo@reparacel.demo", telefono: "8095550111", password: "Demo1234", rol: "cliente" },
];
