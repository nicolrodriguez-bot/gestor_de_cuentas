# Gestión de la Configuración del Software (GCS / SCM)

## 1. Elementos de configuración (CI)
| CI | Ubicación | Responsable |
|---|---|---|
| Código backend | `server.js` | Equipo backend |
| Código frontend | `public/` | Equipo frontend |
| Pruebas | `test.js` | QA |
| Documentación | `docs/`, `README.md` | Todos |
| Despliegue | `Dockerfile`, `render.yaml` | DevOps |
| Variables de entorno (plantilla) | `.env.example` | DevOps |

## 2. Estrategia de ramas (GitHub Flow + develop)
- `main`: producción, siempre desplegable. Protegida: solo se cambia con Pull Request aprobado.
- `develop`: integración de funcionalidades.
- `feature/<nombre>`: una rama por historia (ej. `feature/login-google`).
- `fix/<nombre>`: correcciones.

## 3. Convención de commits (Conventional Commits)
`feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `chore: ...`.

## 4. Control de cambios
1. Se crea un Issue describiendo el cambio.
2. Se trabaja en una rama `feature/*` o `fix/*`.
3. Se abre Pull Request hacia `develop`; mínimo 1 revisor y `npm test` en verde.
4. Al cerrar un sprint, `develop` se fusiona en `main` y se crea un tag.

## 5. Versionado
Semántico `MAJOR.MINOR.PATCH`. Prototipo actual: `v0.1.0`. Cada release se etiqueta (`git tag v0.1.0`).

## 6. Gestión de configuración y secretos
- Los secretos **nunca** se suben al repositorio (`.env` está en `.gitignore`).
- Cada entorno define sus variables: `PORT`, `JWT_SECRET`, `DB_PATH`.
- `.env.example` documenta las variables requeridas.

## 7. Líneas base
| Línea base | Contenido | Tag |
|---|---|---|
| LB1 | Prototipo 50-60% (auth, grupos, gastos, balances) | `v0.1.0` |
| LB2 | Gastos desiguales, Google login, categorías | `v0.2.0` |
| LB3 | Versión final | `v1.0.0` |

## 8. Auditoría
Revisión al cierre de cada sprint: coincidencia entre lo desplegado, el tag y la documentación.
