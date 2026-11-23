# Plan de pruebas — Cuentas Claras

Se combinan **pruebas automatizadas** (se ejecutan con `npm test`) y **pruebas manuales** sobre el producto desplegado.

## 1. Pruebas automatizadas

| Archivo | Qué verifica |
| --- | --- |
| `test.js` | Lógica del dinero: reparto en partes iguales, reparto por porcentajes (sin perder centavos, 100% a una persona) y simplificación de deudas. |
| `test.api.js` | Servidor completo con base de datos en memoria: registro, inicio de sesión (correcto, contraseña incorrecta, correo repetido, contraseña corta), rutas protegidas sin token, grupos, invitación de miembros, acceso denegado a no miembros, gastos iguales y por porcentajes, rechazo de porcentajes que no suman 100, balances, transferencias sugeridas y pagos de deudas. |

Ejecución: `npm test`

## 2. Pruebas manuales sobre el producto desplegado

Sustituir `URL` por la dirección pública del despliegue.

| # | Caso | Pasos | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| M1 | Servicio activo | Abrir `URL/api/health` | Responde `{"ok":true}` | |
| M1b | Cuenta de demostración | Iniciar sesión con `ana@demo.com` / `demo1234` | Entra y ve el grupo "Viaje a Cartagena" con 2 gastos de ejemplo | |
| M2 | Registro | Crear cuenta con nombre, correo y contraseña de 6+ caracteres | Entra a la lista de grupos | |
| M3 | Contraseña corta | Registrarse con contraseña de 3 caracteres | Mensaje de error, no crea cuenta | |
| M4 | Cerrar e iniciar sesión | Salir y volver a entrar con el mismo correo | Inicio de sesión correcto | |
| M5 | Contraseña incorrecta | Iniciar sesión con clave errónea | Mensaje "Correo o contraseña incorrectos" | |
| M6 | Persistencia | Registrar un gasto, recargar la página y volver a entrar | El gasto sigue ahí (los datos están en la base de datos) | |
| M7 | Crear grupo e invitar | Crear "Viaje a Cartagena" e invitar a un segundo usuario registrado | El invitado ve el grupo | |
| M8 | Invitar a alguien no registrado | Invitar un correo inexistente | Mensaje pidiendo que se registre primero | |
| M9 | Gasto en partes iguales | Registrar $100.000 entre dos personas | Cada una asume $50.000 | |
| M10 | Gasto por porcentajes | Registrar $100.000 con 70% / 30% | Luis debe $70.000 a Ana | |
| M11 | Porcentajes inválidos | Registrar 50% + 40% | Rechazado: deben sumar 100% | |
| M12 | Saldar deuda | Marcar el pago desde "Cómo saldar" | Los saldos quedan en cero | |
| M13 | Acceso a grupo ajeno | Con un tercer usuario, intentar abrir el grupo | Acceso denegado | |
| M14 | Celular | Abrir `URL` desde el navegador del teléfono | La interfaz se adapta y funciona | |

## 3. Nota sobre los datos en el despliegue

El despliegue usa el plan gratuito de Render, que no ofrece disco persistente: al reiniciarse el servicio (por ejemplo, tras un rato sin visitas) la base de datos SQLite vuelve a estar vacía. Para que el inicio de sesión siempre sea verificable, al arrancar con la base vacía la aplicación crea las cuentas de demostración `ana@demo.com` y `luis@demo.com` (contraseña `demo1234`) y un grupo de ejemplo. Con un plan de pago bastaría agregar un disco persistente para conservar los datos.