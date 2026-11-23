# Plan de pruebas — Cuentas Claras

Se combinan **pruebas automatizadas** (se ejecutan con `npm test`) y **pruebas manuales** sobre el producto desplegado.

## 1. Pruebas automatizadas

| Archivo | Qué verifica |
| --- | --- |
| `test.js` | Lógica del dinero: reparto en partes iguales, reparto por porcentajes (sin perder centavos, 100% a una persona) y simplificación de deudas. |
| `test.api.js` | Servidor completo con base de datos en memoria: registro, inicio de sesión (correcto, contraseña incorrecta, correo repetido, contraseña corta), rutas protegidas sin token, grupos, invitación de miembros, acceso denegado a no miembros, gastos iguales y por porcentajes, rechazo de porcentajes que no suman 100, balances, transferencias sugeridas y pagos de deudas. |

Ejecución: `npm test`

Resultado: las dos pruebas pasan (`OK: reparto equitativo, por porcentajes y simplificación de deudas` y `OK: registro, login, grupos, gastos, porcentajes, balances y pagos`).

## 2. Pruebas manuales sobre el producto desplegado

URL probada: https://cuentas-claras-sn4m.onrender.com — fecha de las pruebas: 22 de noviembre de 2026.

| # | Caso | Pasos | Resultado esperado | Resultado |
| --- | --- | --- | --- | --- |
| M1 | Servicio activo | Abrir `URL/api/health` | Responde `{"ok":true}` | OK |
| M2 | Inicio de sesión con la cuenta de demostración | Entrar con `ana@demo.com` / `demo1234` | Entra y ve el grupo "Viaje a Cartagena" con 2 gastos de ejemplo | OK |
| M3 | Registro de una cuenta nueva | Crear una cuenta con nombre, correo y contraseña de 6+ caracteres y volver a entrar con ella | Entra a la lista de grupos | OK |
| M4 | Contraseña incorrecta | Iniciar sesión con una clave errónea | Mensaje de error, no permite el acceso | OK |
| M5 | Gasto por porcentajes y persistencia | Registrar un gasto con reparto 70% / 30%, recargar la página (F5) | El gasto se registra y sigue ahí tras recargar (los datos están en la base de datos) | OK |

## 3. Nota sobre los datos en el despliegue

El despliegue usa el plan gratuito de Render, que no ofrece disco persistente: al reiniciarse el servicio (por ejemplo, tras un rato sin visitas) la base de datos SQLite vuelve a estar vacía. Para que el inicio de sesión siempre sea verificable, al arrancar con la base vacía la aplicación crea las cuentas de demostración `ana@demo.com` y `luis@demo.com` (contraseña `demo1234`) y un grupo de ejemplo. Con un plan de pago bastaría agregar un disco persistente para conservar los datos.