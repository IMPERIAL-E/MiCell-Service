// Carga los JSON de marcas y servicios, y resuelve qué servicios aplican a cada modelo.

const CARACTERISTICAS_BASE = { gama: "media" };

export function slug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export class Modelo {
  constructor(marca, serie, entrada) {
    const datos = typeof entrada === "string" ? { nombre: entrada } : entrada;
    const { nombre, ...propias } = datos;
    this.nombre = nombre;
    this.slug = slug(nombre);
    this.marcaId = marca.id;
    this.marcaNombre = marca.nombre;
    this.serie = serie.nombre;
    this.sistema = marca.sistema;
    // Prioridad: modelo > serie > marca > base.
    this.caracteristicas = {
      ...CARACTERISTICAS_BASE,
      ...marca.caracteristicas,
      ...(serie.gama ? { gama: serie.gama } : {}),
      ...serie.caracteristicas,
      ...propias,
    };
  }

  get nombreCompleto() {
    return this.nombre.toLowerCase().startsWith(this.marcaNombre.toLowerCase())
      ? this.nombre
      : `${this.marcaNombre} ${this.nombre}`;
  }
}

class Catalogo {
  #marcas = [];
  #servicios = null;
  #cargando = null;

  cargar() {
    this.#cargando ??= Promise.all([
      fetch("data/marcas.json").then((r) => r.json()),
      fetch("data/servicios.json").then((r) => r.json()),
    ]).then(([marcas, servicios]) => {
      this.#marcas = marcas.marcas.map((m) => ({
        ...m,
        series: m.series.map((s) => ({ ...s, modelos: s.modelos.map((e) => new Modelo(m, s, e)) })),
      }));
      this.#servicios = servicios;
      return this;
    });
    return this.#cargando;
  }

  get marcas() {
    return this.#marcas;
  }

  get categorias() {
    return this.#servicios.categorias;
  }

  marca(id) {
    return this.#marcas.find((m) => m.id === id) ?? null;
  }

  modelos(marcaId) {
    return this.marca(marcaId)?.series.flatMap((s) => s.modelos) ?? [];
  }

  modelo(marcaId, modeloSlug) {
    return this.modelos(marcaId).find((m) => m.slug === modeloSlug) ?? null;
  }

  totalModelos() {
    return this.#marcas.reduce((t, m) => t + this.modelos(m.id).length, 0);
  }

  buscar(texto, limite = 12) {
    const q = slug(texto);
    if (q.length < 2) return [];
    const resultados = [];
    for (const marca of this.#marcas) {
      for (const modelo of this.modelos(marca.id)) {
        if (slug(modelo.nombreCompleto).includes(q)) {
          resultados.push(modelo);
          if (resultados.length >= limite) return resultados;
        }
      }
    }
    return resultados;
  }

  servicio(id) {
    for (const cat of this.categorias) {
      const s = cat.servicios.find((x) => x.id === id);
      if (s) return { ...s, categoria: cat.nombre };
    }
    return null;
  }

  // Un servicio aplica si el modelo cumple todas sus condiciones de "requiere".
  // Si el modelo es desconocido ("Otro modelo"), se muestran todos.
  aplica(servicio, modelo) {
    if (!modelo || !servicio.requiere) return true;
    return Object.entries(servicio.requiere).every(([clave, esperado]) => {
      const valor = modelo.caracteristicas[clave];
      return Array.isArray(esperado) ? esperado.includes(valor) : valor === esperado;
    });
  }

  categoriasPara(modelo) {
    return this.categorias
      .map((cat) => ({ ...cat, servicios: cat.servicios.filter((s) => this.aplica(s, modelo)) }))
      .filter((cat) => cat.servicios.length > 0);
  }

  precio(servicio, modelo) {
    if (!servicio.escala) return servicio.precioBase;
    const gama = modelo?.caracteristicas.gama ?? "media";
    const factor = this.#servicios.multiplicadorGama[gama] ?? 1;
    return Math.round((servicio.precioBase * factor) / 50) * 50;
  }
}

export const catalogo = new Catalogo();
