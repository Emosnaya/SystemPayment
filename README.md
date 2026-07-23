# SystemPayment

Sistema de pagos en arquitectura de monorepo: API REST en **Node.js/TypeScript (Express)**, microservicio de procesamiento en **Python (FastAPI)** y base de datos **PostgreSQL**.

La API nunca almacena el número completo de la tarjeta: solo titular, fecha de expiración y los **últimos 4 dígitos** (`ultimos_cuatro`), en cumplimiento con prácticas PCI-DSS.

---

## Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Cliente   │────▶│  api_node :3000  │────▶│ payment_service:8000│
│  (Postman)  │     │  Express / TS    │     │ FastAPI (simulación)│
└─────────────┘     └────────┬─────────┘     └─────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ postgres_db:5432│
                    │   sistempayment │
                    └─────────────────┘
```

| Componente | Carpeta | Rol |
|---|---|---|
| API REST | `api-node/` | Usuarios, tarjetas, pagos e historial |
| Microservicio | `payment-service-python/` | Simula aprobación/rechazo (~80% / ~20%) |
| Base de datos | `db/init.sql` | Esquema: `usuarios`, `tarjetas`, `pagos` |

Arquitectura por capas de la API: **Controllers → Services → Repositories → PostgreSQL**.

---

## Requisitos

### Con Docker (recomendado)

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/)

### Arranque manual

- Node.js 20+ y npm
- Python 3.10+
- PostgreSQL 15+

---

## Opción A — Levantar con Docker Compose

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Esto construye e inicia los 3 servicios:

| Servicio | Puerto | Descripción |
|---|---|---|
| `postgres_db` | `5432` | PostgreSQL 15; ejecuta `db/init.sql` al primer arranque |
| `payment_service` | `8000` | Microservicio FastAPI |
| `api_node` | `3000` | API REST Express |

Comprueba que la API responde:

```bash
curl http://localhost:3000/health
```

Detener:

```bash
docker compose down
```

> **Nota:** `init.sql` solo se aplica la primera vez que se crea el volumen. Para reinicializar el esquema:
>
> ```bash
> docker compose down -v
> docker compose up --build
> ```

---

## Opción B — Arranque manual paso a paso

### 1. PostgreSQL

Crea la base de datos y aplica el esquema:

```bash
# Crear DB (ajusta usuario/host si es necesario)
createdb sistempayment

# Aplicar esquema
psql -U postgres -d sistempayment -f db/init.sql
```

### 2. Microservicio Python

```bash
cd payment-service-python
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Documentación interactiva: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. API Node.js

```bash
cd api-node
cp .env.example .env
npm install
npm run dev
```

La API quedará en [http://localhost:3000](http://localhost:3000).

Scripts útiles:

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con recarga (`ts-node-dev`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la build de producción |
| `npm test` | Ejecuta tests con Jest |

---

## Tests

### API Node.js (`api-node`)

Tests de integración con **Jest** + **Supertest** en `api-node/src/__tests__/`.

| Archivo | Qué cubre |
|---|---|
| `users.test.ts` | `POST /users`: DTO válido (201), validaciones Zod (400), email duplicado (409) |
| `payments.test.ts` | `POST /payments`: microservicio Python mockeado con `APPROVED` / `REJECTED` (201) y DTO inválido (400) |

```bash
cd api-node
npm install
npm test
```

Los repositorios y la llamada `axios` al microservicio Python se mockean; no hace falta tener Postgres ni el servicio Python corriendo.

### Microservicio Python (`payment-service-python`)

Tests con **pytest** + **httpx** en `payment-service-python/tests/`.

| Archivo | Qué cubre |
|---|---|
| `test_main.py` | `POST /process-payment`: HTTP 200 y `status` ∈ `APPROVED` \| `REJECTED` |

```bash
cd payment-service-python
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -v
```

---

## Variables de entorno

### `api-node` (archivo `.env`)

| Variable | Descripción | Ejemplo local |
|---|---|---|
| `PORT` | Puerto HTTP de la API | `3000` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://postgres:postgres@localhost:5432/sistempayment` |
| `PAYMENT_SERVICE_URL` | URL base del microservicio Python | `http://localhost:8000` |

Plantilla: [`api-node/.env.example`](api-node/.env.example)

### Docker Compose

Las variables de `api_node` se definen en `docker-compose.yml` y usan los nombres de servicio de la red interna:

```text
DATABASE_URL=postgresql://postgres:postgres@postgres_db:5432/sistempayment
PAYMENT_SERVICE_URL=http://payment_service:8000
```

Credenciales por defecto de Postgres en Compose:

| Variable | Valor |
|---|---|
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| `POSTGRES_DB` | `sistempayment` |

---

## Endpoints de la API

Base URL: `http://localhost:3000`

### `GET /health`

Health check.

```bash
curl http://localhost:3000/health
```

### `POST /users`

Crea un usuario.

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana García",
    "email": "ana.garcia@example.com"
  }'
```

| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` | string | Requerido, máx. 150 |
| `email` | string | Requerido, único, formato email |

**Respuesta `201`:** objeto usuario con `id` (UUID).

### `POST /cards`

Registra una tarjeta ficticia asociada a un usuario. Solo se guardan titular, expiración y últimos 4 dígitos.

```bash
curl -X POST http://localhost:3000/cards \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": "<USER_UUID>",
    "titular": "Ana García",
    "numero_tarjeta": "4111111111111111",
    "fecha_expiracion": "12/28"
  }'
```

| Campo | Tipo | Reglas |
|---|---|---|
| `usuario_id` | UUID | Debe existir |
| `titular` | string | Requerido |
| `numero_tarjeta` | string | 13–19 dígitos; no se persiste completo |
| `fecha_expiracion` | string | `YYYY-MM-DD`, `MM/YY` o `MM/YYYY` |

**Respuesta `201`:** tarjeta con `ultimos_cuatro` (nunca el número completo).

### `POST /payments`

Registra un pago. La API llama al microservicio Python (`POST /process-payment`), recibe `APPROVED` o `REJECTED` y persiste el resultado en PostgreSQL.

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": "<USER_UUID>",
    "tarjeta_id": "<CARD_UUID>",
    "monto": 150.75
  }'
```

| Campo | Tipo | Reglas |
|---|---|---|
| `usuario_id` | UUID | Debe existir |
| `tarjeta_id` | UUID | Debe pertenecer al usuario |
| `monto` | number | Debe ser > 0 |

**Respuesta `201`:** pago con `estado` (`APPROVED` \| `REJECTED`) y `transaction_id` del microservicio.

### `GET /users/:id/payments`

Historial de pagos del usuario (más recientes primero).

```bash
curl http://localhost:3000/users/<USER_UUID>/payments
```

---

## Flujo de prueba recomendado

1. Crear usuario → guardar `id`
2. Registrar tarjeta con ese `usuario_id` → guardar `id` de tarjeta
3. Crear uno o más pagos con `usuario_id` + `tarjeta_id`
4. Consultar el historial con `GET /users/:id/payments`

### Colección Postman

Importa en Postman el archivo:

[`Payment_System.postman_collection.json`](Payment_System.postman_collection.json)

La colección incluye scripts que guardan automáticamente `userId` y `cardId` en variables para encadenar las peticiones.

---

## Estructura del repositorio

```text
SystemPayment/
├── api-node/                    # API REST Node.js + TypeScript
│   ├── src/
│   │   ├── __tests__/           # Jest + Supertest (users, payments)
│   │   ├── config/              # DB Pool, env
│   │   ├── controllers/
│   │   ├── services/            # Incluye llamada axios al microservicio
│   │   ├── repositories/
│   │   ├── schemas/             # Validaciones Zod
│   │   ├── middlewares/         # errorHandler, validate
│   │   └── routes/
│   ├── jest.config.js
│   ├── Dockerfile
│   └── .env.example
├── payment-service-python/      # Microservicio FastAPI
│   ├── tests/                   # pytest (process-payment)
│   ├── main.py
│   ├── requirements.txt
│   ├── pytest.ini
│   └── Dockerfile
├── db/
│   └── init.sql                 # Esquema PostgreSQL
├── docker-compose.yml
├── Payment_System.postman_collection.json
└── README.md
```

---

## Errores comunes

| Código | Significado |
|---|---|
| `400` | Validación Zod fallida o tarjeta no pertenece al usuario |
| `404` | Usuario o tarjeta no encontrados |
| `409` | Email duplicado |
| `502` | Microservicio de pagos no disponible |
| `500` | Error interno |

Las respuestas de error siguen el formato:

```json
{
  "error": "mensaje",
  "details": {}
}
```

---

## Licencia

ISC
