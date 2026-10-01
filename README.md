# MiCell-Service

Este proyecto web es una demostración visual y funcional de un servicio en línea para solicitar reparaciones de teléfonos celulares. Su objetivo es facilitar y gestionar las solicitudes de cualquier persona que necesite reparar su equipo: desde elegir la marca y el modelo hasta describir el problema, simular el pago y recibir la confirmación de su orden.

Proyecto de la materia **Interacción Humano-Computadora (IHC)**. Cada orden se envía por correo al taller.

- **Tecnologías:** HTML, CSS y JavaScript puro (módulos ES y clases), sin frameworks ni backend.
- **Datos:** catálogo en archivos JSON dentro del proyecto (`data/`).
- **Almacenamiento:** `localStorage` del navegador (usuarios, sesión y órdenes).
- **Correo:** [EmailJS](https://www.emailjs.com) desde el navegador.
- **Despliegue:** Vercel, como sitio estático.

## Funcionalidades

| Área | Qué hace |
|---|---|
| Catálogo | 36 marcas y más de 1,100 modelos por nombre comercial, agrupados por serie. Opción “Mi modelo no aparece” para escribirlo a mano. |
| Menú de marcas | Al pasar el mouse por “Marcas” se despliegan las marcas; al pasar por una marca aparecen sus modelos. Incluye buscador. |
| Servicios | 57 servicios en 12 categorías. Solo se muestran los compatibles con el modelo (por ejemplo, un iPhone no muestra microSD). El precio se ajusta a la gama del equipo. |
| Descripción del problema | Caja de texto con contador y ejemplos rápidos; se envía completa en el ticket. |
| Inicio de sesión | Registro, login, “Recordarme”, contraseñas con hash SHA-256 y sal. |
| Pago simulado | Efectivo o tarjeta con validación real de formato (Luhn, vencimiento, CVV) y detección de Visa, Mastercard, Amex y Discover. Solo se guardan los últimos 4 dígitos. |
| Entidades de pago | Franja al pie de cada página con las redes y bancos aceptados. |
| Comprobante | Número de orden, detalle, totales con ITBIS, línea de tiempo del estado e impresión. |
| Mis solicitudes | Historial del cliente con filtro por estado y cancelación. |
| Administración | Panel para ver todas las órdenes, buscar, filtrar y cambiar su estado. |

## Cuentas de demostración

Se crean automáticamente la primera vez que se abre el sitio:

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | `demo@reparacel.demo` | `Demo1234` |
| Administrador | `admin@reparacel.demo` | `Admin123` |

## Tarjetas de prueba

| Número | Resultado |
|---|---|
| `4242 4242 4242 4242` | Visa aprobada |
| `5555 5555 5555 4444` | Mastercard aprobada |
| `3782 822463 10005` | American Express aprobada (CVV de 4 dígitos) |
| `6011 1111 1111 1117` | Discover aprobada |
| `4000 0000 0000 0002` | Rechazada por fondos insuficientes |
| `4000 0000 0000 9995` | Rechazada por tarjeta reportada |

Usa cualquier fecha futura (por ejemplo `12/30`) y cualquier CVV.

## Ejecutarlo en tu computadora

El sitio carga los JSON con `fetch`, así que **no funciona abriendo el archivo con doble clic**. Hace falta un servidor local:

- **VS Code:** instala la extensión *Live Server* (el proyecto la recomienda), clic derecho en `index.html` → *Open with Live Server*.
- **Python:** `python -m http.server 5500` y abre `http://localhost:5500`.

## Configurar el envío de correos (EmailJS)

1. Crea una cuenta gratuita en [emailjs.com](https://www.emailjs.com).
2. En **Email Services**, conecta tu correo personal (Gmail, Outlook…). Copia el **Service ID**.
3. En **Email Templates**, crea una plantilla nueva y pega el contenido de [`emailjs/plantilla-taller.html`](emailjs/plantilla-taller.html). Las instrucciones de asunto y destinatario están al inicio del archivo. Copia el **Template ID**.
4. *(Opcional)* Crea una segunda plantilla con [`emailjs/plantilla-cliente.html`](emailjs/plantilla-cliente.html) para enviarle una confirmación al cliente.
5. En **Account → General**, copia tu **Public Key**.
6. Pega los valores en [`js/config.js`](js/config.js):

```js
export const EMAILJS = {
  publicKey: "tu_public_key",
  serviceId: "service_xxxxxxx",
  templateIdTaller: "template_xxxxxxx",
  templateIdCliente: "", // opcional
};
```

Estos valores son públicos por diseño. Tu correo personal queda guardado solo en el panel de EmailJS, nunca en el código. Mientras estén vacíos, el sitio funciona igual y avisa que el correo no está configurado.

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com), **Add New → Project** e importa el repositorio.
3. *Framework Preset:* **Other**. No hace falta comando de build ni carpeta de salida.
4. **Deploy**. Cada `git push` a `main` vuelve a desplegar automáticamente.

## Estructura

```
├── index.html             Inicio: servicios y marcas
├── solicitud.html         Asistente de solicitud (equipo → problema → entrega → pago)
├── comprobante.html       Detalle de una orden
├── mis-solicitudes.html   Historial del cliente
├── admin.html             Panel de administración
├── login.html             Inicio de sesión y registro
├── css/estilos.css        Estilos (variables de color en :root)
├── data/
│   ├── marcas.json        36 marcas → series → modelos con sus características
│   └── servicios.json     Categorías, servicios, precios base y compatibilidad
├── emailjs/               Plantillas de correo para pegar en EmailJS
└── js/
    ├── config.js          Nombre del taller, EmailJS, precios, cuentas demo
    ├── almacen.js         Acceso a localStorage / sessionStorage
    ├── auth.js            Clases Usuario y Auth
    ├── catalogo.js        Clases Modelo y Catalogo (filtros y precios)
    ├── orden.js           Clase Orden y estados
    ├── pago.js            Clase ValidadorTarjeta (Luhn, red, simulación)
    ├── correo.js          Envío del ticket con EmailJS
    ├── validacion.js      Validaciones de formularios
    ├── ui.js              Encabezado, menú de marcas, pie y utilidades
    └── paginas/           Lógica de cada página
```

## Agregar o corregir modelos

En `data/marcas.json`, cada marca tiene `caracteristicas` por defecto y una lista de `series`. Un modelo puede ser un texto o un objeto que cambia alguna característica:

```json
{ "nombre": "Galaxy S10e", "huella": "lateral" }
```

Características disponibles: `puerto` (`usb-c`, `lightning`, `micro-usb`), `jack`, `microsd`, `inalambrica`, `huella` (`pantalla`, `lateral`, `trasera`, `boton`, `faceid`, `ninguna`), `tapa` (`vidrio`, `plastico`, `metal`), `plegable` y `gama` (`basica`, `media`, `alta`, `premium`).

> Las características y los precios son aproximados y sirven para la demostración.
