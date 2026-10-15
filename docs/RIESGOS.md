# Gestión de Riesgos del Software (Wiki)

Escala: Probabilidad (P) y Impacto (I) de 1 (bajo) a 5 (alto). Exposición = P × I.

| ID | Riesgo | P | I | Exp. | Mitigación | Plan de contingencia | Responsable |
|---|---|---|---|---|---|---|---|
| R1 | Cálculo incorrecto de saldos | 2 | 5 | 10 | Montos en centavos enteros; pruebas unitarias (`test.js`) | Corrección y recálculo desde datos (los saldos se derivan, no se guardan) | Backend |
| R2 | Filtración de contraseñas/secretos | 2 | 5 | 10 | bcrypt, `.env` fuera de Git, JWT con expiración | Rotar `JWT_SECRET`, forzar nuevo login | DevOps |
| R3 | Acceso a grupos ajenos | 2 | 4 | 8 | Middleware `guard` valida pertenencia en cada ruta | Revisión de logs y parche | Backend |
| R4 | Pérdida de datos (SQLite en disco) | 3 | 4 | 12 | Disco persistente; respaldos periódicos del `.db` | Restaurar último respaldo; migrar a PostgreSQL | DevOps |
| R5 | Retraso en el cronograma | 4 | 3 | 12 | Alcance por prioridades (MoSCoW), sprints cortos | Recortar funciones "Could" | Líder |
| R6 | Desconocimiento de tecnologías en el equipo | 3 | 3 | 9 | Programación en parejas, documentación | Reasignar tareas | Líder |
| R7 | Fallos tras el despliegue | 3 | 3 | 9 | Desplegar desde el inicio; variables de entorno | Rollback al tag anterior | DevOps |
| R8 | Conflictos de integración en Git | 3 | 2 | 6 | Ramas cortas, PR con revisión | Resolver en reunión y rebase | Todos |
| R9 | Abuso (fuerza bruta en login) | 3 | 3 | 9 | Pendiente: limitar intentos (rate limiting) | Bloqueo temporal por IP | Backend |

## Proceso
1. **Identificar**: lluvia de ideas al inicio de cada sprint.
2. **Analizar**: se calcula la exposición.
3. **Planificar**: mitigación para exposición ≥ 9.
4. **Monitorear**: se revisa esta tabla en cada retrospectiva y se registran riesgos nuevos o cerrados.
