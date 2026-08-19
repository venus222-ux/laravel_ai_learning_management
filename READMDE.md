# EMS AI Learning — Laravel + React (Docker)

Aplicație full-stack de învățare AI, rulată integral în Docker.

## Stack tehnic

| Componentă              | Tehnologie                                      |
|-------------------------|-------------------------------------------------|
| Backend                 | Laravel 12 + FrankenPHP                         |
| Frontend                | React + Vite                                    |
| Autentificare           | JWT (tymon/jwt-auth) + HttpOnly Cookie          |
| Autorizare              | Spatie Roles & Permissions                      |
| Bază de date relațională| MySQL 8                                         |
| Bază de date documente  | MongoDB 7                                       |
| Cache & Queue           | Redis 7                                         |
| Search                  | Elasticsearch                                   |
| Broadcasting / WebSockets | Soketi (compatibil Pusher protocol)           |
| Monitorizare cozi       | Laravel Horizon                                 |
| Observabilitate         | Prometheus + Grafana                            |
| Admin DB                | phpMyAdmin                                      |

## Arhitectură — servicii Docker

```
laravel_app        → FrankenPHP, servește API-ul HTTP (:8000)
laravel_worker     → Horizon, procesează cozile Redis
frontend           → Vite dev server (:5173)
mysql              → date relaționale (:3307 host)
mongodb            → colecții documente (:27018 host)
redis              → queue + cache (:6380 host)
elasticsearch      → indexare full-text (:9200)
soketi             → server WebSocket local, protocol Pusher (:6001)
prometheus         → colectare metrici (:9090)
grafana            → dashboard-uri (:3000)
phpmyadmin         → UI admin MySQL (:8081)
```

## Pornire rapidă

```bash
# 1. Pornește toate serviciile
docker compose up -d --build

# 2. Backend setup
cp backend/.env.example backend/.env
docker compose exec laravel_app composer install
docker compose exec laravel_app php artisan key:generate
docker compose exec laravel_app php artisan jwt:secret
docker compose exec laravel_app php artisan migrate --seed

# 3. Frontend setup
cp frontend/.env.example frontend/.env
docker compose exec frontend npm install
docker compose up -d --force-recreate frontend
docker compose exec frontend npm install laravel-echo pusher-js
```

Verifică starea serviciilor:

```bash
docker compose ps
```

Apoi deschide:

- Frontend → http://localhost:5173
- API → http://localhost:8000
- phpMyAdmin → http://localhost:8081
- Grafana → http://localhost:3000 (user: `admin`)
- Horizon → http://localhost:8000/horizon

## URL-uri importante

| Serviciu         | URL                     |
|------------------|-------------------------|
| React (Vite)     | http://localhost:5173   |
| Laravel API      | http://localhost:8000   |
| Horizon          | http://localhost:8000/horizon |
| phpMyAdmin       | http://localhost:8081   |
| Grafana          | http://localhost:3000   |
| Prometheus       | http://localhost:9090   |
| Elasticsearch    | http://localhost:9200   |
| Soketi (WS)      | http://localhost:6001   |
| MySQL (host)     | localhost:3307          |
| MongoDB (host)   | localhost:27018         |
| Redis (host)     | localhost:6380          |

## Configurație .env (important!)

### Backend (`backend/.env`)

```dotenv
DB_HOST=mysql
DB_PORT=3306
REDIS_HOST=redis
DB_MONGO_HOST=mongodb
ELASTICSEARCH_HOST=elasticsearch
PUSHER_HOST=soketi          # ← din interiorul Docker
PUSHER_PORT=6001
PUSHER_SCHEME=http
```

### Frontend (`frontend/.env`)

```dotenv
VITE_API_URL=http://localhost:8000
VITE_PUSHER_HOST=localhost  # ← din browser
VITE_PUSHER_PORT=6001
```

> **Regulă simplă:**
>
> - Din **containere** → folosești numele serviciului (`mysql`, `redis`, `soketi`...)
> - Din **browser** → folosești `localhost` + portul publicat

### Variabile critice (trebuie identice în `laravel_app`, `laravel_worker`, `frontend`, `soketi`)

```
PUSHER_APP_ID=news_aggregator
PUSHER_APP_KEY=news_aggregator_key
PUSHER_APP_SECRET=news_aggregator_secret
PUSHER_HOST=soketi
PUSHER_PORT=6001
PUSHER_SCHEME=http
```

Pentru `soketi` → aceleași valori sub prefixul `SOKETI_DEFAULT_APP_*`.  
Pentru `frontend` → sub prefixul `VITE_PUSHER_*`.

## Comenzi curente de dezvoltare

**Status & loguri:**

```bash
docker compose ps
docker compose logs -f
docker compose logs -f laravel_app
docker compose logs -f laravel_worker
```

**Restart:**

```bash
docker compose restart laravel_app
docker compose restart laravel_worker
docker compose down
docker compose down -v          # atenție: șterge volumele (datele)
```

**Laravel:**

```bash
docker compose exec laravel_app bash
docker compose exec laravel_app php artisan migrate
docker compose exec laravel_app php artisan optimize:clear
docker compose exec laravel_app php artisan horizon:status
docker compose exec laravel_app php artisan schedule:work
docker compose exec laravel_app php artisan config:clear
docker compose exec laravel_worker php artisan config:clear
docker compose restart laravel_worker laravel_app
```

**Repornire doar Horizon (fără recreare container):**

```bash
docker compose exec laravel_worker php artisan horizon:terminate
```

Supervisorul Horizon repornește automat workerii cu config proaspăt.

**Frontend:**

```bash
docker compose exec frontend npm install
docker compose exec frontend npm run build
```

## Servicii Docker

| Service          | Port host | Rol                        |
|------------------|-----------|----------------------------|
| `laravel_app`    | 8000      | API + FrankenPHP           |
| `laravel_worker` | —         | Horizon (queues)           |
| `frontend`       | 5173      | React + Vite               |
| `mysql`          | 3307      | MySQL                      |
| `mongodb`        | 27018     | MongoDB                    |
| `redis`          | 6380      | Cache + Queue              |
| `elasticsearch`  | 9200      | Search                     |
| `soketi`         | 6001      | WebSockets                 |
| `prometheus`     | 9090      | Metrics                    |
| `grafana`        | 3000      | Dashboards                 |
| `phpmyadmin`     | 8081      | Admin MySQL                |

## Credențiale

**MySQL / phpMyAdmin**

- Database: `news_aggregator`
- User: `news_aggregator`
- Password: `secret`

**Soketi / Pusher**

- App ID: `news_aggregator`
- Key: `news_aggregator_key`
- Secret: `news_aggregator_secret`

**Grafana**

- User: `admin`

## Autentificare & Broadcasting

- API: JWT (`tymon/jwt-auth`), guard `api`
- Canale private Laravel: `Broadcast::routes(['middleware' => ['auth:api']])`
- Driver broadcasting: `pusher`, redirecționat către Soketi local prin `config/broadcasting.php` → `options.host/port/scheme`

## Depanare rapidă

| Simptom                              | Verifică                                                                 |
|--------------------------------------|--------------------------------------------------------------------------|
| `auth_key should be a valid app key` | `config/broadcasting.php` are `options.host/port/scheme`, nu doar `cluster` |
| `App key not found` în loguri Soketi | Compară `SOKETI_DEFAULT_APP_KEY` cu `PUSHER_APP_KEY` din toate serviciile |
| WebSocket nu se conectează (`wss://`)| Verifică `enabledTransports: ["ws"]` în Echo config                      |
| `laravel_worker` apare unhealthy     | Normal — nu servește HTTP; healthcheck dezactivat                        |
| Config nu se aplică după schimbare `.env` | `php artisan config:clear` + restart `laravel_app` + `laravel_worker` |
````