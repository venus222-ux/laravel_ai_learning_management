# EMS AI Learning — Laravel + React (Docker)

Platformă de învățare cu generare de conținut AI (rezumate, quiz-uri) și notificări în timp real, rulată integral în Docker.

## Stack tehnic

| Componentă | Tehnologie |
|---|---|
| Backend | Laravel 12 + FrankenPHP |
| Frontend | React + Vite + TypeScript |
| Autentificare | JWT (`tymon/jwt-auth`) + HttpOnly Cookie |
| Autorizare | Spatie Roles & Permissions |
| Bază de date relațională | MySQL 8 |
| Bază de date documente | MongoDB 7 |
| Cache & Queue | Redis 7 |
| Search | Elasticsearch |
| Broadcasting / WebSockets | Soketi (compatibil Pusher protocol) |
| AI | Groq API (`openai-php/client`, endpoint compatibil OpenAI) |
| Monitorizare cozi | Laravel Horizon |
| Observabilitate | Prometheus + Grafana |
| Admin DB | phpMyAdmin |

## Arhitectură — servicii Docker

```
laravel_app        → FrankenPHP, servește API-ul HTTP (:8000)
laravel_worker     → Horizon, procesează coada `emails` (GenerateAiContentJob, AiContentGenerated broadcast)
frontend           → Vite dev server (:5173)
mysql              → date relaționale: users, courses, lessons (:3307 host)
mongodb            → colecția interactions (log-uri AI: prompt, response, status) (:27018 host)
redis              → queue + cache (:6380 host)
elasticsearch      → indexare full-text (:9200)
soketi             → server WebSocket local, protocol Pusher (:6001 client, :9601 admin)
prometheus         → colectare metrici (:9090)
grafana            → dashboard-uri (:3000)
phpmyadmin         → UI admin MySQL (:8081)
```

## Pornire rapidă

```bash
git clone <repo>
cd ems-ai-learning
cp backend/.env.example backend/.env    # completează OPENAI_API_KEY / OPENAI_BASE_URL

docker compose up -d --build

# Backend setup
docker compose exec laravel_app composer install
docker compose exec laravel_app php artisan key:generate
docker compose exec laravel_app php artisan jwt:secret
docker compose exec laravel_app php artisan migrate --seed

# Frontend setup
cp frontend/.env.example frontend/.env
docker compose exec frontend npm install
docker compose exec frontend npm install laravel-echo pusher-js
docker compose up -d --force-recreate frontend
```

Verifică starea tuturor serviciilor:
```bash
docker compose ps
```
Toate ar trebui să fie `Up`, iar `laravel_app`, `mysql` marcate `(healthy)`. `laravel_worker` nu are healthcheck (nu servește HTTP) — starea lui se verifică prin loguri, nu prin coloana STATUS.

Apoi deschide:

| Serviciu | URL |
|---|---|
| React (Vite) | http://localhost:5173 |
| Laravel API | http://localhost:8000 |
| Horizon | http://localhost:8000/horizon |
| phpMyAdmin | http://localhost:8081 |
| Grafana | http://localhost:3000 (user: `admin`) |
| Prometheus | http://localhost:9090 |
| Elasticsearch | http://localhost:9200 |
| Soketi (WS) | http://localhost:6001 |
| MySQL (host) | localhost:3307 |
| MongoDB (host) | localhost:27018 |
| Redis (host) | localhost:6380 |

## Comenzi curente de dezvoltare

**Loguri live per serviciu:**
```bash
docker compose logs -f laravel_worker
docker compose logs -f soketi
docker compose logs -f laravel_app
```

**Log Laravel (aplicație):**
```bash
docker compose exec laravel_worker tail -f storage/logs/laravel.log
```

**Rulare artisan:**
```bash
docker compose exec laravel_app php artisan <comanda>
```

**Acces Horizon (monitor cozi):**
```
http://127.0.0.1:8000/horizon
```

**Test manual generare AI (bypass frontend, verificare rapidă job + broadcast):**
```bash
docker compose exec laravel_worker php artisan tinker --execute="App\Jobs\GenerateAiContentJob::dispatch(11, 1, 'quiz', 'Generate a 3-question multiple choice quiz...'); echo 'DISPATCHED';"
```

**Config cache — de rulat după orice schimbare de `.env` sau `config/*.php`:**
```bash
docker compose exec laravel_app php artisan config:clear
docker compose exec laravel_worker php artisan config:clear
docker compose restart laravel_worker laravel_app
```

**Restart curat complet (elimină procese Horizon stale și config cache stale din imagine):**
```bash
docker compose down
docker compose build laravel_app laravel_worker
docker compose up -d --force-recreate
```

**Repornire doar Horizon (fără a recrea containerul):**
```bash
docker compose exec laravel_worker php artisan horizon:terminate
```
Supervisorul Horizon repornește automat workerii cu config proaspăt.

## Fluxul de date

```
Frontend (LessonViewer) → handleAiAction("summary" | "quiz")
    ↓ POST triggerLessonAi(courseId, lessonId, type)
GenerateAiContentJob (coadă: emails)
    ↓ ActivityLogger::logAiInteraction — salvează interacțiunea în MongoDB (status: pending)
    ↓ AiService->generate() → Groq API (model configurat prin AI_MODEL)
    ↓ interaction->update(response, model_used, tokens_used, status: completed)
    ↓ event(AiContentGenerated)
        ↓
AiContentGenerated (event, ShouldBroadcastNow)
    ↓ Laravel Broadcasting → Soketi (:6001)
    ↓ Soketi → clientul abonat la private-user.{userId}
    ↓ Frontend (Echo .listen(".ai.completed")) → afișează rezumatul/quiz-ul, fără refresh
```

În caz de eroare în timpul generării, job-ul marchează interacțiunea `status: failed` și emite tot `AiContentGenerated`, cu `type: "error"`, pentru ca UI-ul să iasă din starea de loading.

## Modele principale

- **User** — auth JWT, roluri Spatie (admin/user)
- **Course / Lesson** — structura de curs, urmărește lecțiile completate per user
- **Interaction** (MongoDB) — log al interacțiunilor AI: `user_id`, `lesson_id`, `type` (summary/quiz), `prompt`, `response`, `model_used`, `tokens_used`, `status` (pending/completed/failed)

## Autentificare & Broadcasting

- API: JWT (`tymon/jwt-auth`), guard `api`
- Canale private Laravel: `Broadcast::routes(['middleware' => ['auth:api']])`
- Canal per utilizator: `private-user.{id}`, autorizare în `routes/channels.php`
- Driver broadcasting: `pusher`, redirecționat către Soketi local prin `config/broadcasting.php` → `options.host/port/scheme`

## Variabile de mediu critice (trebuie identice în `laravel_app`, `laravel_worker`, `frontend`, `soketi`)

```
PUSHER_APP_ID=ai_learning_management
PUSHER_APP_KEY=ai_learning_management_key
PUSHER_APP_SECRET=ai_learning_management_secret
PUSHER_HOST=soketi
PUSHER_PORT=6001
PUSHER_SCHEME=http
```

Pentru `soketi`, aceleași valori sub prefixul `SOKETI_DEFAULT_APP_*`.
Pentru `frontend`, sub prefixul `VITE_PUSHER_*`.

> ⚠️ Nu păstra concomitent în `.env` credențiale reale de Pusher (dashboard.pusher.com) alături de cele locale Soketi — dacă `config:cache` prinde valorile greșite la build, broadcast-urile ajung la Pusher.com în loc de containerul local, iar Soketi loghează `App ID not found` fără nicio eroare vizibilă în Horizon.

## AI

```
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=openai/gpt-oss-120b
```

Folosit de `AiService` (wrapper peste `openai-php/client`) pentru generarea de rezumate și quiz-uri, rulat prin `GenerateAiContentJob`. Groq schimbă periodic modelele disponibile — dacă apare eroarea `The model ... does not exist or you do not have access to it`, verifică lista curentă de modele Groq și actualizează `AI_MODEL`.

## Depanare rapidă

| Simptom | Verifică |
|---|---|
| `The model ... does not exist or you do not have access to it` (Horizon, job failed) | Modelul Groq din `AI_MODEL` a fost depreciat — vezi console.groq.com/docs/deprecations și actualizează `.env` |
| `App key ... not in this cluster` (browser) | Frontend-ul folosește `cluster` din Pusher.js — pentru Soketi elimină `cluster` real și folosește `wsHost`/`wsPort`/`forceTLS` |
| `Options object must provide a cluster` (browser, laravel-echo) | Versiunile noi de `laravel-echo` cer un `cluster` truthy chiar și cu `wsHost` — adaugă o valoare placeholder, `wsHost` are prioritate la conectare |
| `App ID not found: <id>` în loguri Soketi, dar Horizon arată job-ul `completed` | Config `.env` cache stale în imaginea Docker — `php artisan config:clear` pe `laravel_app` + `laravel_worker`, apoi `docker compose build` + `--force-recreate` |
| `auth_key should be a valid app key` | `config/broadcasting.php` are `options.host/port/scheme`, nu doar `cluster` |
| WebSocket nu se conectează (`wss://`) | Verifică `forceTLS`/`enabledTransports` în `echo.ts` — Soketi local rulează pe `ws://`, nu `wss://` |
| Eveniment broadcastat dar UI nu se actualizează | Verifică singleton-ul `Echo` din `getEcho()` — dacă a fost creat cu `token: null` înainte de hidratarea store-ului, header-ul de auth rămâne stale; apelează `resetEcho()` după login |
| `laravel_worker` apare unhealthy | Normal — nu servește HTTP; healthcheck dezactivat |
| Config nu se aplică după schimbare `.env` | `php artisan config:clear` + restart `laravel_app` + `laravel_worker`; dacă persistă, verifică `config:cache` în `Dockerfile` la build |