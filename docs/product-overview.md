# Pulso: qué es, cómo funciona y hacia dónde va

Documento de referencia del producto, de punta a punta. Describe qué hace Pulso, quién lo usa y con qué permisos, las reglas del negocio, el estado actual y lo que se proyecta.

> Las reglas exactas (para desarrollo) viven en `atm-pulso-api/docs/domain/business-rules.md`. Si este documento y ese archivo difieren, **gana el de reglas**.

---

## 1. Qué es Pulso

**Pulso** es un sistema web para administrar gimnasios, de **Atmósfera**. Está pensado para administradores de gimnasio y personal de recepción, no para gente técnica: pantallas simples, íconos con etiqueta, colores para los estados y poco texto.

Con Pulso un gimnasio puede:

- Registrar a sus **miembros** y venderles **membresías** por meses.
- Emitir una **boleta** numerada por cada venta y llevar el **registro de pagos**.
- Controlar el **ingreso** de cada persona en la puerta (permitido o denegado, con el motivo).
- Vender **pases del día** a quien no es miembro.
- Ver un **resumen** del gimnasio (miembros vigentes, ingresos del mes, quién está por vencer).
- Manejar **varias sedes** por gimnasio y **varios gimnasios** agrupados por Atmósfera, con un equipo de usuarios con permisos distintos.

Todo lo que ve el usuario está en **español**. Se ingresa con **DNI y contraseña**; no hay correo ni recuperación por correo.

---

## 2. Modelo de negocio

Atmósfera **orquesta todo desde la consola web** (`atm-console-web`, que es el superadmin de la plataforma):

- Se da de alta una **empresa** (cliente de atm-auth-api). Cada empresa habilitada para Pulso es un **gimnasio**; Atmósfera los agrupa en **grupos**.
- Las **sedes** de cada gimnasio las crea y las quita **solo Atmósfera**, desde la consola. Atmósfera cobra un monto por sede; ese precio se acuerda con el cliente y **no se gestiona dentro de los sistemas**.
- Ni el administrador ni la recepción crean gimnasios ni sedes, y Pulso no tiene planes ni límites propios.

---

## 3. Cómo se organiza una cuenta

```
Grupo (etiqueta interna de Atmósfera; no es un usuario)
 └── Gimnasio = marca / empresa de atm-auth-api  (nombre, RUC opcional, color, logo)
      └── Sede (nombre, dirección; la crea Atmósfera)
```

- **Grupo**: etiqueta interna con la que Atmósfera agrupa gimnasios que considera relacionados (por ejemplo, una persona con tres marcas). No es un usuario, no tiene dueño y **hoy no comparte nada**: solo reserva el lugar para poder hacerlo más adelante. Solo Atmósfera lo crea, desde la consola; ninguna pantalla de Pulso lo muestra.
- **Gimnasio**: una marca (con RUC opcional), nombre visible, logo y color de marca. La sesión siempre trabaja en **un** gimnasio; una persona con acceso a varios cambia de uno a otro con el **selector de gimnasio**.
- **Sede**: local físico donde se atiende. Las sedes de un mismo gimnasio comparten identidad.
- Cada **miembro pertenece a un gimnasio**; el directorio se comparte entre las **sedes de ese gimnasio**. La misma persona puede ser miembro de dos gimnasios (incluso del mismo grupo) como dos registros independientes: el documento es único por gimnasio.
- Los datos de un gimnasio **nunca** se mezclan con los de otro, ni siquiera dentro de un grupo. Las boletas (R-000001) y los pases del día (D-000001) tienen su numeración **por gimnasio**.

---

## 4. Roles y diferencias

Hay **dos roles**, definidos en atm-auth-api para el sistema `pulso`. Cada persona tiene un solo usuario y su **DNI es su identificador** de ingreso. No existe propietario ni superadmin dentro de Pulso: la plataforma la administra Atmósfera desde la consola.

### 4.1 Resumen

| | Administrador (admin) | Recepción (receptionist) |
|---|---|---|
| **Quién es** | Administrador o gerente del gimnasio | Personal de mostrador |
| **Lo crea** | Atmósfera (consola) o otro administrador | Un administrador |
| **Alcance** | Todas las sedes del gimnasio en el que trabaja | Solo las sedes que le asignaron |

### 4.2 Qué ve cada rol

| Pantalla | Administrador | Recepción |
|---|---|---|
| Resumen (dashboard) | Sí | No (entra a Control de acceso) |
| Miembros | Sí | Sí |
| Control de acceso | Sí | Sí |
| Pagos e ingresos | Sí | Sí, **sin indicadores (KPIs)** |
| Usuarios | Sí | No |
| Tarifas | Sí | No |
| Color del gimnasio | Sí | No |

### 4.3 Diferencias clave, rol por rol

**Administrador**
- Es el **único que crea usuarios** (otros administradores y recepción). La consola le da el permiso de gestionar usuarios (`manage_users`).
- Gestiona el equipo, las tarifas, la regla de acceso entre sedes y el color del gimnasio en el que trabaja.
- No crea ni quita gimnasios ni sedes, ni cambia el nombre o el logo: eso lo hace Atmósfera.
- No se edita a sí mismo (ni su rol ni su alcance).
- Si trabaja para varios gimnasios, elige uno con el selector.

**Recepción**
- Opera el día a día en las sedes asignadas: inscribir y renovar miembros, registrar pagos, controlar el acceso, vender pases del día.
- No ve el resumen, ni la configuración, ni el equipo.
- En Pagos ve el listado pero **no los indicadores** (totales, ticket promedio, etc.).
- Debe tener **al menos una sede** asignada.

### 4.4 Reglas comunes de usuarios

- Desactivar un usuario **surte efecto de inmediato** en Pulso. Nunca se borra el historial. Nadie puede desactivarse a sí mismo.
- Nadie edita su propio rol ni su alcance. Cada usuario sí puede editar en su **perfil** su nombre y celular, y cambiar su contraseña.
- El **DNI no se corrige** en Pulso: es la identidad del usuario en atm-auth-api.
- Quién aparece en la lista de Usuarios: el administrador ve a todas las personas del gimnasio.

---

## 5. Acceso y contraseñas

El inicio de sesión **no vive en Pulso: lo hace atm-auth-api**, y el navegador lo llama directamente (login, renovación, cierre de sesión y cambio de contraseña). Pulso solo recibe el token y lo valida.

- Se ingresa con **DNI + contraseña**. No hay correo ni "olvidé mi contraseña".
- Al crear un usuario, su **contraseña inicial es su DNI**, y debe cambiarla en su primer ingreso. Mientras no la cambie, auth no entrega sesión: Pulso muestra la pantalla "Crea tu contraseña" y, al guardarla, entra con la nueva.
- Si alguien olvida su contraseña, un administrador la **restablece** (vuelve a ser el DNI y se pide cambiarla otra vez).
- La contraseña nueva tiene al menos 8 caracteres y es distinta de la actual y del DNI.
- La sesión dura mientras el navegador conserve el token de renovación (según la política del sistema en auth: persistente o temporal). El token de acceso vive solo en memoria y dura minutos.
- Seguridad: argon2id y bloqueo por intentos en atm-auth-api; tokens RS256 que pulso-api valida con la llave pública (JWKS).

---

## 6. Módulos y funcionalidades

### 6.1 Miembros
- Datos del miembro: tipo de documento (**DNI** de 8 dígitos o **carné de extranjería** de 9 a 12), número, nombre completo, **celular** (obligatorio: 9 dígitos, empieza con 9) y la **sede de inscripción**. **No se pide correo.**
- Botón de **buscar por DNI** que autocompleta el nombre (el carné se escribe a mano). Si la búsqueda falla, igual se puede escribir el nombre.
- No puede haber dos miembros con el mismo documento en una organización; si ocurre, el sistema muestra al existente para renovarlo.
- Lista con búsqueda, filtros por estado (puntos de color con conteos) y por sede.
- Después de inscrito, el personal solo puede editar **nombre y celular**; el documento no cambia.
- Acción rápida de **WhatsApp** hacia el miembro.

### 6.2 Membresías, inscripción y renovación
- Se venden **solo por meses enteros** (de 1 a 24). Sin días y sin descuentos: si hay un descuento, se escribe el **importe** final.
- La inscripción pide: meses, fecha de inicio (hoy por defecto, puede ser futura), importe, medio de pago y alcance de acceso.
- Precios rápidos sugeridos en pantalla (1 mes 100, 2 meses 190, 3 meses 270, 6 meses 500). Son solo sugerencias.
- La fecha de fin = inicio + meses calendario (31 ene + 1 mes = 28/29 feb). La calcula el servidor.
- **Renovar** crea un periodo nuevo: empieza donde terminó el actual si aún está vigente, o hoy si ya venció.
- **Medios de pago**: Yape/Plin (un solo chip), Efectivo, Tarjeta, Transferencia.
- Cada inscripción o renovación crea, en una sola operación atómica: el periodo, el **pago** y la **boleta**.

### 6.3 Estados del miembro (por color)
| Color | Estado | Significado |
|---|---|---|
| Verde | Vigente | Tiene un periodo que incluye hoy |
| Ámbar | Por vencer | Vigente y vence en 7 días o menos |
| Rojo | Vencido | Ya no tiene periodo vigente |
| Azul | Por iniciar | Su membresía empieza en una fecha futura |

La fecha de "hoy" es la de **Lima**. El servidor calcula el estado y los días restantes; la web nunca los recalcula.

### 6.4 Alcance de acceso de la membresía
Se elige al inscribir y define **en qué sedes puede entrar** el miembro:
- **Solo su sede** (por defecto).
- **Su gimnasio** (todas las sedes de ese gimnasio).

No existe un alcance más amplio: entre gimnasios distintos no se comparte nada.

Por defecto quedan marcadas todas las sedes del alcance y el personal puede **desmarcar** algunas (por ejemplo, una promoción válida en 3 de 5 sedes). La sede de inscripción siempre se incluye. Si el gimnasio tiene una sola sede, esta elección se oculta.

Además, cada **gimnasio** tiene la regla **"acceso entre sedes"**, que decide su administrador: si se apaga, los miembros de ese gimnasio solo pueden entrar por su sede de inscripción.

### 6.5 Boletas (comprobantes)
- Numeración **`R-000001`**, secuencial **por organización**, sin saltos ni repetidos aunque se vendan dos membresías a la vez.
- La boleta guarda: número, fecha, miembro, plan, inicio y fin, importe, medio de pago, sede y gimnasio (nombre visible, RUC, dirección) y las sedes que habilita.
- Se puede **reimprimir cualquier boleta pasada**.
- **No es un comprobante tributario**; el texto impreso lo indica. Incluye los **términos y condiciones** del gimnasio.

### 6.6 Control de acceso
Recepción digita el documento del miembro (teclado numérico) y el sistema responde **permitido** o **denegado**, con el motivo:

| Resultado | Motivo |
|---|---|
| Denegado | No está registrado |
| Denegado | La membresía no incluye esa sede |
| Denegado | La membresía aún no inicia (con fecha) |
| Denegado | La membresía venció (con fecha) |
| **Permitido** | Membresía vigente (con fecha de fin; aviso si está por vencer) |

- La decisión la toma el **servidor**, y **cada intento** (permitido o no) queda registrado: quién, sede, hora, resultado y motivo.
- Se muestran los últimos ingresos de la sede.
- Hay botones de referencia con los tipos de acceso y de cliente.
- **Desde Control de acceso no se inscriben miembros**; eso se hace solo en Miembros.

### 6.7 Pase del día
- Entrada única para quien no es miembro. **No** crea miembro ni lleva datos obligatorios: recepción solo confirma el medio de pago (por defecto Efectivo). Documento, nombre y celular son **opcionales** (sirven para promociones futuras).
- El **precio es fijo por gimnasio** (15.00 por defecto) y solo lo cambia el administrador en **Tarifas**. No se imprime ticket.
- Cada venta crea, a la vez: el pase, una boleta **`D-000001`** (serie propia), un pago y un ingreso permitido.
- Cuenta en el listado de pagos, en los indicadores y en los ingresos del mes.

### 6.8 Pagos e ingresos
- Listado **por sede**, ordenado del más reciente, con paginación. Filtros: **fechas a la izquierda y medios de pago a la derecha**. Abre en "hoy"; el otro atajo es "este mes".
- **Indicadores**: total cobrado, número de pagos, ticket promedio, pases del día, medio más usado y total por cada medio (siempre los cuatro, aunque sea 0).
- **Recepción no ve los indicadores.**
- Botón **Descargar** (CSV) del conjunto filtrado completo: boleta, miembro, documento, plan, importe, medio, fecha.

### 6.9 Resumen (dashboard)
Para la sede activa: **miembros activos**, **ingresos del mes** (incluye pases del día), **por vencer** y los primeros cinco por vencer con sus acciones rápidas. Solo se muestran datos reales, nunca cifras de ejemplo.

### 6.10 Tarifas
La **lista de precios** de cada gimnasio: una tarifa por duración (de 1 a 24 meses; por ejemplo 1 mes S/ 100, 2 meses S/ 180) y el precio del **pase del día**. Las define el administrador del gimnasio. Al inscribir o renovar, la tarifa se propone como importe base y quien cobra puede cambiarlo; lo que se cobra queda registrado en el pago y en la boleta. Si el gimnasio aún no tiene tarifas, el importe se escribe a mano.

### 6.11 Color del gimnasio
Por gimnasio: **color de marca** (selector con código hexadecimal) y **logo** (PNG, JPG o WebP de hasta 10 MB; un logo por gimnasio, se sube una vez por cada gimnasio que lo use). El nombre y el logo los define Atmósfera desde la consola (el logo es el del perfil de la empresa; pulso-api entrega un enlace temporal en `logo_url`); el administrador solo cambia el **color** de su gimnasio. El color tiñe botones, elementos seleccionados y boletas; el logo aparece en la navegación y en la boleta impresa. Las sedes de un gimnasio comparten la identidad. Los archivos los guarda atm-storage-api (Cloudflare R2); Pulso no almacena ni sirve archivos de logo.

### 6.12 Usuarios y permisos
Alta, edición, activación y desactivación del equipo, con las reglas de cada rol de la sección 4. Cada usuario tiene nombre completo, DNI, rol, gimnasio (administradores) o sedes (recepción) y estado.

### 6.13 Perfil
Disponible **para todos los roles**: ver sus datos, editar nombre y celular, cambiar contraseña. DNI, rol y alcance son de solo lectura.

### 6.14 Grupos, gimnasios y sedes (en la consola)
Ya no hay panel de plataforma en Pulso. Desde `atm-console-web` Atmósfera crea las empresas (gimnasios), habilita Pulso, da de alta a los administradores, agrupa los gimnasios en **grupos** y crea las sedes de cada gimnasio.

---

## 7. Principios de diseño de la interfaz

Las personas que usan Pulso son administradores de gimnasio y recepcionistas, no usuarios de software. "Se enseña una vez y se recuerda."

- **Íconos antes que palabras**; cada ícono lleva etiqueta (nombre accesible + tooltip). El texto se reserva para la acción principal de la pantalla.
- **Mismo ícono, mismo lugar, en todas partes** (agregar, editar, ver, renovar, WhatsApp, buscar). Las acciones de fila mantienen posiciones fijas.
- **El estado se indica con color** (verde, ámbar, rojo, azul). Los filtros son puntos de color con conteos.
- **Sin subtítulos explicativos, migas de pan ni pies de página.** Si una pantalla necesita un párrafo para entenderse, se rediseña.
- Lo de **todos los días** vive en la barra lateral; la **configuración de una sola vez** (gimnasios y reglas, usuarios, tarifas, identidad) está bajo "Configuración".
- **Nunca se muestran datos inventados.**
- Cuerpo de tablas a 14 px y objetivos táctiles de al menos 38 px.
- Formularios: nada de `select` ni `input date` nativos. Listas cortas con **tarjetas de opción** y fechas con un **selector de fecha**. Los campos obligatorios llevan asterisco rojo y el pie del formulario dice "* Obligatorio".
- Los diálogos se cierran **solo** con Cancelar o con la X (no al arrastrar el mouse fuera).

---

## 8. Cómo está construido y en qué estado está

### 8.1 Piezas

| Pieza | Tecnología | Dirección |
|---|---|---|
| **Web** (`atm-pulso-web`) | React 19, TypeScript, Vite | pulso.atmosferast.com |
| **API** (`atm-pulso-api`) | Go, Gin, PostgreSQL | pulso-api.atmosferast.com |
| **Servicio de identidad** (`atm-identity-api`) | Interno de Atmósfera | Consulta de DNI y RUC |

- **Multi-tenant** con aislamiento por organización: un recurso de otra organización responde "no encontrado", nunca "prohibido".
- Dos ramas: **`main`** (trabajo) y **`production`** (un push a `production` dispara el despliegue por GitHub Actions). Solo se despliega lo que ya pasó por `main`.
- Despliegue con Docker en un VPS, detrás de nginx con certificado comodín de Cloudflare.

### 8.2 Estado actual

| Área | Estado |
|---|---|
| **API** | **Completa en local** (planes API-01 a 06): sesión y perfil, clientes y equipo, miembros y boletas, accesos y pases del día, pagos y resumen. Contrato en `openapi.yaml`, probada con pruebas de integración. La parte de sesión y búsqueda de DNI/RUC ya está desplegada; el resto espera el despliegue. |
| **Web** | **Conectada a la API real** (planes WEB-01 a 06): ya no hay datos de demostración. Probada con 21 pruebas de extremo a extremo contra la API real. Falta desplegar. |
| **Despliegue** | **Pendiente.** Hay que desplegar primero la API (migraciones 00003 a 00006), insertar el primer superadmin a mano y luego la web (la imagen necesita la dirección de la API al construirse). |

### 8.3 Cómo se entra por primera vez
No hay cuentas de ejemplo ni código de "seed". Atmósfera crea el cliente, las empresas y los usuarios en la consola (atm-console-web), habilita el sistema `pulso` para cada empresa y da a cada administrador el acceso con el rol `admin` y el permiso de gestionar usuarios. La web necesita `VITE_AUTH_API_URL` además de `VITE_API_URL` al construirse.

---

## 9. Hoja de ruta

### 9.1 Hecho en local, a la espera del despliegue
Los seis pasos de la API y de la web están implementados y probados localmente. Los detalles de entrega están en
`atm-pulso-api/docs/RELEASE.md` y `atm-pulso-web/docs/RELEASE.md`. Lo siguiente es **desplegar** (API primero, luego la web)
y hacer la prueba de humo en producción.

| Orden | API | Web | Resultado |
|---|---|---|---|
| 0 | API-01 | | Login, perfil, búsqueda DNI/RUC |
| 1 | API-02 | WEB-01 y WEB-02 | Login y perfil reales; el superadmin crea clientes; equipo y ajustes de gimnasio |
| 2 | API-03 | WEB-03 | Miembros y boletas con datos reales |
| 3 | API-04 | WEB-04 | Control de acceso y pase del día reales |
| 4 | API-05 | WEB-05 | Pagos, descarga y resumen con datos reales |
| 5 | API-06 | WEB-06 | Revisión de seguridad, contrato verificado, limpieza del código demo |

### 9.2 Ya decidido para más adelante
- **Logo del gimnasio**: se muestra desde `logo_url` (enlace temporal de atm-storage-api, vía el perfil de la empresa en atm-auth-api); sin logo se usa el monograma. La subida del logo se hace solo en la consola.
- **Cobro de extras**: hoy el acuerdo queda **registrado** (quién y cuándo) para poder cobrarlo, pero el cobro lo hace Atmósfera fuera del sistema.

### 9.3 Ideas posibles (aún sin decidir ni planificar)
Quedan fuera del alcance actual y requieren decisión del dueño del producto:

- Facturación o cobro automático de los extras.
- Notificaciones y mensajes automáticos (por ejemplo, avisos de vencimiento por WhatsApp).
- Recuperación de contraseña autoservicio (hoy la restablece el superior).
- Correo electrónico asociado a las cuentas.
- Comprobantes tributarios electrónicos (hoy la boleta no lo es).
- Uso de los datos opcionales de pases del día para promociones.
- Exportar a otros formatos además de CSV.
- Eliminar miembros (hoy no se contempla, para conservar el historial).

---

## 10. Glosario

| Término | Significado |
|---|---|
| Organización / cliente | El cliente de atm-auth-api; agrupa sus gimnasios |
| Gimnasio | Una empresa (tenant) de atm-auth-api con Pulso habilitado |
| Sede | Local físico de un gimnasio |
| Miembro | Persona inscrita con una o más membresías |
| Membresía / periodo | Tramo de meses vendidos, con inicio y fin |
| Boleta | Comprobante numerado de cada venta (no tributario) |
| Pase del día | Entrada única para quien no es miembro |
| Alcance de acceso | Sedes donde un miembro puede entrar |
| Grupo | Etiqueta interna que agrupa gimnasios relacionados; no es un usuario |
| Consola | atm-console-web: donde Atmósfera crea empresas, grupos, usuarios y sedes |
