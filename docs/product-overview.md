# Pulso: qué es, cómo funciona y hacia dónde va

Documento de referencia del producto, de punta a punta. Describe qué hace Pulso, quién lo usa y con qué permisos, las reglas del negocio, el estado actual y lo que se proyecta.

> Las reglas exactas (para desarrollo) viven en `atm-pulso-api/docs/domain/business-rules.md`. Si este documento y ese archivo difieren, **gana el de reglas**.

---

## 1. Qué es Pulso

**Pulso** es un sistema web para administrar gimnasios, de **Atmósfera**. Está pensado para dueños de gimnasio y personal de recepción, no para gente técnica: pantallas simples, íconos con etiqueta, colores para los estados y poco texto.

Con Pulso un gimnasio puede:

- Registrar a sus **miembros** y venderles **membresías** por meses.
- Emitir una **boleta** numerada por cada venta y llevar el **registro de pagos**.
- Controlar el **ingreso** de cada persona en la puerta (permitido o denegado, con el motivo).
- Vender **pases del día** a quien no es miembro.
- Ver un **resumen** del gimnasio (miembros vigentes, ingresos del mes, quién está por vencer).
- Manejar **varios gimnasios y varias sedes** bajo una misma cuenta, con un equipo de usuarios con permisos distintos.

Todo lo que ve el usuario está en **español**. Se ingresa con **DNI y contraseña**; no hay correo ni recuperación por correo.

---

## 2. Modelo de negocio

Pulso es **gratis con límites**:

| Incluido gratis | Por cliente |
|---|---|
| Gimnasios | **1** |
| Sedes | **1 por gimnasio** |

- Lo que exceda esos límites se **acuerda directamente con Atmósfera**, que crea y cobra los extras. Los dueños y administradores **nunca** agregan gimnasios o sedes por su cuenta.
- Solo el **superadmin** (Atmósfera) puede crearlos, y debe confirmar expresamente que ya lo acordó con el cliente ("Ya lo acordé con el cliente"). Esa confirmación queda guardada con quién y cuándo, para poder cobrarla.
- Los límites están en **una sola constante** del código, porque el dueño del producto puede cambiarlos.

---

## 3. Cómo se organiza una cuenta

```
Organización (el cliente, es el nombre del propietario)
 └── Gimnasio  (nombre, RUC, color e identidad)
      └── Sede (nombre, dirección)
```

- **Organización**: el cliente. Su nombre es el nombre completo de su propietario.
- **Gimnasio**: negocio con RUC, nombre visible, color de marca y logo. Tiene reglas propias.
- **Sede**: local físico donde se atiende. Las sedes de un mismo gimnasio comparten identidad.
- El **directorio de miembros es siempre compartido** entre todos los gimnasios y sedes del mismo propietario. Un miembro se registra una sola vez.
- Los datos de una organización **nunca** se mezclan con los de otra.

---

## 4. Roles y diferencias

Hay **cuatro roles**. Cada persona tiene un solo usuario y su **DNI es su identificador** de ingreso (único en todo el sistema).

### 4.1 Resumen

| | Superadmin | Propietario (owner) | Administrador (admin) | Recepción (receptionist) |
|---|---|---|---|---|
| **Quién es** | Atmósfera | Dueño del cliente | Gerente de un gimnasio | Personal de mostrador |
| **Lo crea** | Se inserta a mano (el primero) o lo crea otro superadmin | El superadmin, junto con el cliente | El propietario | El propietario, o un administrador para su gimnasio |
| **Alcance** | Cualquier organización, **solo lectura** | Todos los gimnasios y sedes de su organización | **Un** gimnasio y sus sedes | Solo las sedes que le asignaron |
| **Puede escribir datos del gimnasio** | No | Sí | Sí (su gimnasio) | Sí (operación diaria, sus sedes) |

### 4.2 Qué ve cada rol

| Pantalla | Propietario | Administrador | Recepción | Superadmin |
|---|---|---|---|---|
| Resumen (dashboard) | Sí | Sí | No (entra a Control de acceso) | Consulta |
| Miembros | Sí | Sí | Sí | Consulta |
| Control de acceso | Sí | Sí | Sí | Consulta (sin botones de verificar) |
| Pagos e ingresos | Sí | Sí | Sí, **sin indicadores (KPIs)** | Consulta |
| Usuarios | Todos | Recepción de su gimnasio y él mismo | No | Consulta |
| Tarifas | Todos los gimnasios | Su gimnasio | No | Consulta |
| Identidad | No | No | No | **Edita** (cualquier gimnasio) |
| Clientes y gimnasios (panel de plataforma) | No | No | No | **Sí** (es su pantalla de inicio) |

### 4.3 Diferencias clave, rol por rol

**Superadmin (Atmósfera)**
- Crea clientes (propietario + gimnasios + sedes), agrega gimnasios a un cliente o sedes a un gimnasio.
- Es el único que crea gimnasios y sedes, y el único que cambia la identidad de un gimnasio (nombre, color y logo).
- Puede **consultar** (nunca modificar) cualquier organización, una a la vez.
- Corrige datos de propietarios (por ejemplo el DNI) y gestiona sus accesos.
- No pertenece a ninguna organización.

**Propietario**
- Ve y administra todo su negocio: todos los gimnasios y sedes.
- **Es el único que crea administradores.** También crea y gestiona recepción.
- Configura la identidad (nombre visible, color y logo) de cada gimnasio.
- No puede crear gimnasios ni sedes (eso lo acuerda con Atmósfera).
- Nadie, salvo el superadmin, puede modificar a un propietario.

**Administrador**
- Gestiona **un solo gimnasio**: sus sedes, su equipo de recepción y sus tarifas.
- **Solo crea personal de recepción**, y solo para sedes de su gimnasio. Nunca otros administradores.
- No se edita a sí mismo (ni su rol ni su alcance).

**Recepción**
- Opera el día a día en las sedes asignadas: inscribir y renovar miembros, registrar pagos, controlar el acceso, vender pases del día.
- No ve el resumen, ni la configuración, ni el equipo.
- En Pagos ve el listado pero **no los indicadores** (totales, ticket promedio, etc.).
- Debe tener **al menos una sede** asignada.

### 4.4 Reglas comunes de usuarios

- Desactivar un usuario **surte efecto de inmediato** (su sesión deja de valer en la siguiente acción). Nunca se borra el historial. Nadie puede desactivarse a sí mismo.
- Nadie edita su propio rol ni su alcance. Cada usuario sí puede editar en su **perfil** su nombre y celular, y cambiar su contraseña (los datos de rol y alcance son de solo lectura).
- El **DNI solo lo corrige el superior autorizado**: superadmin a propietarios, propietario a administradores y recepción, administrador a recepción de su propio gimnasio. Nadie corrige el suyo, y la corrección cierra sus sesiones.
- Quién aparece en la lista de Usuarios: el propietario ve a todos los de su organización; el administrador se ve a sí mismo y a la recepción de su gimnasio; **nadie ve al superadmin**.

---

## 5. Acceso y contraseñas

- Se ingresa con **DNI + contraseña**. No hay correo ni "olvidé mi contraseña".
- Al crear un usuario, su **contraseña inicial es su DNI**, y debe cambiarla en su primer ingreso. Mientras no la cambie, solo puede ver su perfil y cambiar la contraseña.
- Si alguien olvida su contraseña, su superior autorizado la **restablece** (vuelve a ser el DNI y se pide cambiarla otra vez). Eso cierra las sesiones anteriores.
- La contraseña nueva tiene al menos 8 caracteres y es distinta de la actual.
- Tras cambiarla en el primer ingreso, la persona vuelve a la pantalla de login y entra con su contraseña nueva.
- Seguridad: contraseñas con argon2id, sesión con token que no se guarda en el servidor (se valida en cada acción contra el usuario real), bloqueo temporal tras varios intentos fallidos y límite de peticiones por IP.

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
- **Toda la red** (todas las sedes de la organización).

Por defecto quedan marcadas todas las sedes del alcance y el personal puede **desmarcar** algunas (por ejemplo, una promoción válida en 3 de 5 sedes). La sede de inscripción siempre se incluye. Si la organización tiene una sola sede, esta elección se oculta.

Además, cada **gimnasio** tiene la regla **"acceso entre sedes"**, que decide su administrador o el propietario: si se apaga, los miembros de ese gimnasio solo pueden entrar por su sede de inscripción.

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
- El **precio es fijo por gimnasio** (15.00 por defecto) y solo lo cambia el administrador o el propietario en **Tarifas**. No se imprime ticket.
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
La **lista de precios** de cada gimnasio: una tarifa por duración (de 1 a 24 meses; por ejemplo 1 mes S/ 100, 2 meses S/ 180) y el precio del **pase del día**. Las define el dueño o el administrador del gimnasio. Al inscribir o renovar, la tarifa se propone como importe base y quien cobra puede cambiarlo; lo que se cobra queda registrado en el pago y en la boleta. Si el gimnasio aún no tiene tarifas, el importe se escribe a mano.

### 6.11 Identidad
Por gimnasio: **nombre visible**, **color de marca** (selector con código hexadecimal) y **logo** (PNG, JPG o WebP de hasta 10 MB; un logo por gimnasio, se sube una vez por cada gimnasio que lo use). Solo lo define el superadmin; el dueño y el administrador no ven esta pantalla. El color tiñe botones, elementos seleccionados y boletas; el logo aparece en la navegación y en la boleta impresa. Las sedes de un gimnasio comparten la identidad. Los archivos se guardan en Cloudflare R2.

### 6.12 Usuarios y permisos
Alta, edición, activación y desactivación del equipo, con las reglas de cada rol de la sección 4. Cada usuario tiene nombre completo, DNI, rol, gimnasio (administradores) o sedes (recepción) y estado.

### 6.13 Perfil
Disponible **para todos los roles** (incluida recepción y el superadmin): ver sus datos, editar nombre y celular, cambiar contraseña. DNI, rol y alcance son de solo lectura.

### 6.14 Panel de plataforma (solo superadmin)
- Lista de **clientes** con su propietario, gimnasios (nombre y RUC), sedes, estado del plan y si está activo. Búsqueda por cliente, gimnasio o RUC.
- Métricas: clientes, gimnasios, sedes y usuarios de clientes.
- **Crear cliente**: documento del propietario (con botón de búsqueda), nombres y apellidos, correo, celular, y sus gimnasios con sedes (con búsqueda de RUC). No se pide "tipo de cliente". El nombre del cliente es el nombre del propietario.
- Agregar un gimnasio a un cliente o una sede a un gimnasio, sin límites.
- Correo y celular del propietario son datos de contacto de la organización, no de ingreso.

---

## 7. Principios de diseño de la interfaz

Los clientes son dueños de gimnasio y recepcionistas, no usuarios de software. "Se enseña una vez y se recuerda."

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

### 8.3 Primer superadmin
No hay cuentas de ejemplo ni código de "seed" en el backend. El primer superadmin lo inserta **el dueño del producto a mano** en la base de datos, con el script `scripts/first-superadmin`, que genera el `INSERT` con la contraseña ya protegida. A partir de él se crea todo lo demás desde la propia aplicación.

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
- **Logo del gimnasio y subida de imágenes**: diferido hasta terminar la funcionalidad real; el almacenamiento futuro previsto es **Cloudflare R2**. Mientras tanto se usan el color y el monograma.
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
| Organización / cliente | Cuenta de un propietario; agrupa sus gimnasios y sedes |
| Gimnasio | Negocio con RUC e identidad propia |
| Sede | Local físico de un gimnasio |
| Miembro | Persona inscrita con una o más membresías |
| Membresía / periodo | Tramo de meses vendidos, con inicio y fin |
| Boleta | Comprobante numerado de cada venta (no tributario) |
| Pase del día | Entrada única para quien no es miembro |
| Alcance de acceso | Sedes donde un miembro puede entrar |
| Superadmin | Atmósfera; crea clientes y consulta cuentas en solo lectura |
