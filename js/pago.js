// Validación y simulación de pagos con tarjeta. No se conecta a ningún banco real.
// Nunca se guarda el número completo ni el CVV: solo la red y los últimos 4 dígitos.

const REDES = [
  { id: "amex", nombre: "American Express", patron: /^3[47]/, largos: [15], cvv: 4, grupos: [4, 6, 5] },
  { id: "visa", nombre: "Visa", patron: /^4/, largos: [13, 16, 19], cvv: 3, grupos: [4, 4, 4, 4, 3] },
  { id: "mastercard", nombre: "Mastercard", patron: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/, largos: [16], cvv: 3, grupos: [4, 4, 4, 4] },
  { id: "discover", nombre: "Discover", patron: /^(6011|65|64[4-9])/, largos: [16, 19], cvv: 3, grupos: [4, 4, 4, 4, 3] },
];

// Tarjetas de prueba documentadas en el README que siempre se rechazan.
const TARJETAS_RECHAZADAS = {
  "4000000000000002": "Fondos insuficientes.",
  "4000000000009995": "Tarjeta reportada como robada o perdida.",
};

export class ValidadorTarjeta {
  static limpiar(numero) {
    return String(numero).replace(/\D/g, "");
  }

  static detectarRed(numero) {
    const n = ValidadorTarjeta.limpiar(numero);
    return REDES.find((r) => r.patron.test(n)) ?? null;
  }

  // Algoritmo de Luhn: verifica el dígito de control del número.
  static luhn(numero) {
    const n = ValidadorTarjeta.limpiar(numero);
    if (n.length < 12) return false;
    let suma = 0;
    let doble = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = Number(n[i]);
      if (doble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      suma += d;
      doble = !doble;
    }
    return suma % 10 === 0;
  }

  static formatear(numero) {
    const n = ValidadorTarjeta.limpiar(numero).slice(0, 19);
    const red = ValidadorTarjeta.detectarRed(n);
    const grupos = red?.grupos ?? [4, 4, 4, 4, 3];
    const partes = [];
    let i = 0;
    for (const g of grupos) {
      if (i >= n.length) break;
      partes.push(n.slice(i, i + g));
      i += g;
    }
    return partes.join(" ");
  }

  static validarNumero(numero) {
    const n = ValidadorTarjeta.limpiar(numero);
    const red = ValidadorTarjeta.detectarRed(n);
    if (!n) return "Escribe el número de la tarjeta.";
    if (!red) return "Solo aceptamos Visa, Mastercard, American Express o Discover.";
    if (!red.largos.includes(n.length)) return `Un número ${red.nombre} debe tener ${red.largos.join(" o ")} dígitos.`;
    if (!ValidadorTarjeta.luhn(n)) return "El número de tarjeta no es válido. Revisa los dígitos.";
    return null;
  }

  // Acepta "MM/AA". La tarjeta vence al final del mes indicado.
  static validarVencimiento(texto) {
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(texto.trim());
    if (!m) return "Usa el formato MM/AA.";
    const mes = Number(m[1]);
    const anio = 2000 + Number(m[2]);
    if (mes < 1 || mes > 12) return "El mes debe estar entre 01 y 12.";
    const finDeMes = new Date(anio, mes, 1);
    if (finDeMes <= new Date()) return "La tarjeta está vencida.";
    if (anio > new Date().getFullYear() + 20) return "Revisa el año de vencimiento.";
    return null;
  }

  static validarCVV(cvv, numero) {
    const largo = ValidadorTarjeta.detectarRed(numero)?.cvv ?? 3;
    return new RegExp(`^\\d{${largo}}$`).test(cvv) ? null : `El código de seguridad debe tener ${largo} dígitos.`;
  }

  static validarTitular(nombre) {
    return nombre.trim().length >= 3 && /^[a-zA-ZÀ-ÿñÑ .'-]+$/.test(nombre.trim()) ? null : "Escribe el nombre tal como aparece en la tarjeta.";
  }

  // Simula la respuesta del procesador de pagos tras una breve espera.
  static procesar({ numero, titular }) {
    const n = ValidadorTarjeta.limpiar(numero);
    const red = ValidadorTarjeta.detectarRed(n);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (TARJETAS_RECHAZADAS[n]) {
          reject(new Error(`Pago rechazado: ${TARJETAS_RECHAZADAS[n]}`));
          return;
        }
        resolve({
          metodo: "tarjeta",
          estado: "Aprobado",
          red: red.nombre,
          ultimos4: n.slice(-4),
          titular: titular.trim().toUpperCase(),
          autorizacion: Math.floor(100000 + Math.random() * 900000).toString(),
        });
      }, 1800);
    });
  }
}
