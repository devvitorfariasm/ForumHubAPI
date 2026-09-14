# ForumHubAPI

API RESTful para gerenciamento de tópicos e respostas em um fórum de discussões, com autenticação JWT.

## Stack

- Java 25
- Spring Boot 4.1.1 (Spring MVC, Spring Data JPA, Spring Security 7)
- JWT (jjwt)
- MySQL 8.4 + Flyway
- springdoc-openapi (Swagger UI)
- H2 (somente nos testes)
- Maven, Docker Compose

## Executar com Docker

```bash
docker compose up --build
```

A API sobe em `http://localhost:8080`. O container da API só inicia depois que o MySQL responde ao healthcheck.

## Executar localmente

Suba um MySQL (pode ser só o serviço do compose):

```bash
docker compose up mysql
```

Ou crie o banco manualmente:

```sql
CREATE DATABASE forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'forum_user'@'localhost' IDENTIFIED BY 'forum_password';
GRANT ALL PRIVILEGES ON forum.* TO 'forum_user'@'localhost';
FLUSH PRIVILEGES;
```

Depois:

```bash
./mvnw clean test
./mvnw spring-boot:run
```

As migrações Flyway criam as tabelas automaticamente na primeira execução.

### Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste se necessário.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/forum?...` | URL JDBC do MySQL |
| `DB_USERNAME` | `forum_user` | Usuário do banco |
| `DB_PASSWORD` | `forum_password` | Senha do banco |
| `JWT_SECRET` | valor de desenvolvimento | Segredo HMAC com no mínimo 32 caracteres |
| `JWT_EXPIRATION_MINUTES` | `60` | Validade do token |
| `SERVER_PORT` | `8080` | Porta HTTP |
| `CORS_ALLOWED_ORIGINS` | `*` | Origens permitidas, separadas por vírgula |

## Testes

```bash
./mvnw test
```

Os testes usam o perfil `test` com H2 em memória (modo MySQL) e rodam as mesmas migrações Flyway. Não é preciso ter MySQL disponível. Os testes de integração cobrem autenticação, autorização, validação, paginação, regras de negócio e o formato de erro.

## Documentação interativa

Com a aplicação rodando:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

No Swagger, clique em **Authorize** e informe o token obtido no login.

## Autenticação

Cadastro:

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "SenhaSegura123"
}
```

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "maria@example.com",
  "password": "SenhaSegura123"
}
```

Resposta de ambos:

```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "type": "Bearer",
  "expiresInSeconds": 3600
}
```

Use o token nas demais rotas:

```http
Authorization: Bearer SEU_TOKEN
```

## Endpoints

| Método | Rota | Descrição | Acesso |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Cadastra usuário e devolve token | público |
| `POST` | `/api/v1/auth/login` | Autentica e devolve token | público |
| `GET` | `/api/v1/health` | Health check | público |
| `POST` | `/api/v1/topics` | Cria tópico | autenticado |
| `GET` | `/api/v1/topics` | Lista tópicos paginados | autenticado |
| `GET` | `/api/v1/topics/{id}` | Detalha tópico | autenticado |
| `PUT` | `/api/v1/topics/{id}` | Atualiza tópico | autor ou moderador |
| `DELETE` | `/api/v1/topics/{id}` | Remove tópico e suas respostas | autor ou moderador |
| `PATCH` | `/api/v1/topics/{id}/close` | Fecha o tópico | autor ou moderador |
| `PATCH` | `/api/v1/topics/{id}/solve` | Marca o tópico como resolvido | autor ou moderador |
| `POST` | `/api/v1/topics/{topicId}/replies` | Responde ao tópico | autenticado |
| `GET` | `/api/v1/topics/{topicId}/replies` | Lista respostas do tópico | autenticado |
| `PATCH` | `/api/v1/topics/{topicId}/replies/{replyId}/solution` | Marca a resposta como solução e resolve o tópico | autor ou moderador |

### Paginação

`GET /api/v1/topics?page=0&size=20&sort=createdAt,desc`

```json
{
  "content": [ { "id": 1, "title": "...", "status": "OPEN", "authorName": "Maria Silva", "createdAt": "..." } ],
  "page": { "size": 20, "number": 0, "totalElements": 1, "totalPages": 1 }
}
```

### Regras de negócio

- Não é permitido criar dois tópicos com o mesmo título (ignorando maiúsculas) e a mesma mensagem.
- Tópicos fechados (`CLOSED`) não aceitam respostas nem edição.
- Apenas o autor, moderadores (`MODERATOR`) ou administradores (`ADMIN`) alteram um tópico.
- Marcar uma resposta como solução muda o status do tópico para `SOLVED`.
- Novos cadastros recebem o papel `USER`.

## Formato de erro

Todas as respostas de erro seguem o mesmo contrato:

```json
{
  "timestamp": "2026-09-13T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Dados inválidos.",
  "path": "/api/v1/topics",
  "fields": [
    { "field": "title", "message": "must not be blank" }
  ]
}
```

| Status | Quando |
| --- | --- |
| `400` | Validação de campos, JSON mal formatado, parâmetro inválido |
| `401` | Sem token, token inválido/expirado ou credenciais incorretas no login |
| `403` | Usuário autenticado sem permissão sobre o recurso |
| `404` | Tópico, resposta ou rota inexistente |
| `405` | Método HTTP não suportado |
| `409` | Regra de negócio violada (duplicidade, tópico fechado etc.) |
| `500` | Erro inesperado (detalhes apenas no log) |

## Arquitetura

```text
controller  -> entrada HTTP (validação de DTOs, status codes)
service     -> regras de negócio e transações
repository  -> Spring Data JPA (EntityGraph para evitar N+1)
domain      -> entidades JPA, enums e regras de domínio
dto         -> records de entrada e saída
security    -> JWT, filtro, CORS, respostas 401/403 em JSON
exception   -> ApiError e handler global
config      -> OpenAPI
```

Records são usados nos DTOs. As entidades JPA são classes mutáveis porque o Hibernate precisa de construtor sem argumentos e controla o estado persistido.
