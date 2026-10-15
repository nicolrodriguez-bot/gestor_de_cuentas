# Cuentas Claras

Aplicación web para repartir gastos en grupo y saber quién le debe a quién (estilo Splitwise).

**Stack:** Node.js + Express + SQLite (backend) · HTML/CSS/JS (frontend servido por Express) · JWT + bcrypt (autenticación propia).

## Funcionalidades del prototipo (~55%)
- [x] Registro e inicio de sesión
- [x] Crear grupos e invitar miembros por correo
- [x] Registrar y eliminar gastos con división equitativa entre participantes
- [x] Balances por persona y simplificación de deudas
- [x] Marcar pagos (liquidaciones)
- [ ] División desigual / por porcentajes
- [ ] Login con Google/Auth0
- [ ] Categorías, notificaciones, exportar, multi-moneda

## Ejecutar en local
```bash
cp .env.example .env     # edita JWT_SECRET
npm install
npm test
npm start                # http://localhost:3000
```

## Variables de entorno
`PORT`, `JWT_SECRET` (obligatoria en producción), `DB_PATH`.

## Despliegue (Render)
1. Sube el repo a GitHub.
2. En Render: New → Blueprint → selecciona el repo (usa `render.yaml`, con disco persistente para SQLite).
3. Cada push a `main` redespliega.

## Documentación de calidad
- [GCS / SCM](docs/GCS.md) · [Riesgos (wiki)](docs/RIESGOS.md) · [Mockups](docs/MOCKUPS.md)

## API
`POST /api/auth/register|login` · `GET|POST /api/groups` · `GET /api/groups/:id` · `POST /api/groups/:id/members|expenses|settlements` · `DELETE /api/groups/:id/expenses/:eid`
