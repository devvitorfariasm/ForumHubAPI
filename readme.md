# Forum API

API RESTful para gerenciamento de um fórum de discussões, permitindo que usuários criem tópicos, publiquem respostas e acompanhem discussões. O backend é desenvolvido em Java 17+ com Spring Boot, persistência em MySQL e autenticação/autorização via JWT.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do banco de dados](#configuração-do-banco-de-dados)
- [Configuração do projeto](#configuração-do-projeto)
- [Execução local](#execução-local)
- [Testando a API](#testando-a-api)
- [Próximos passos](#próximos-passos)

---

## Sobre o projeto

O objetivo é centralizar discussões em torno de tópicos abertos por usuários, com autenticação, autorização e controle de acesso. O projeto será evoluído em sprints, começando pelo backend.

---

## Tecnologias

- Java 17+
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL
- Maven 3.9+
- Flyway (ou Liquibase)
- Lombok
- JUnit

---

## Pré-requisitos

- Java 17 ou superior
- Maven 3.9+ (ou use o Maven Wrapper: `./mvnw`)
- MySQL (local ou via Docker)
- Git

---

## Configuração do banco de dados

1. Crie o banco de dados:

```sql
CREATE DATABASE forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. (Opcional) Crie um usuário dedicado:

```sql
CREATE USER 'forum_user'@'localhost' IDENTIFIED BY 'forum_password';
GRANT ALL PRIVILEGES ON forum.* TO 'forum_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Configuração do projeto

No arquivo `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/forum?useSSL=false&serverTimezone=UTC
    username: forum_user
    password: forum_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

server:
  port: 8080
```

---

## Execução local

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd forum-api
```

2. Execute a aplicação:

Linux/macOS:
```bash
./mvnw spring-boot:run
```

Windows:
```bash
mvnw.cmd spring-boot:run
```

Ou, se Maven estiver instalado:
```bash
mvn spring-boot:run
```

A API estará disponível em: [http://localhost:8080](http://localhost:8080)

---

## Testando a API

Teste o endpoint de saúde:

```bash
curl http://localhost:8080/api/health
```

Resposta esperada:
```json
{
  "application": "forum-api",
  "status": "UP"
}
```

---

## Próximos passos

- Modelar entidades: User, Topic, Reply, Role
- Implementar CRUD de tópicos e respostas
- Adicionar autenticação e autorização (JWT)
- Implementar testes automatizados
- Documentar endpoints com Swagger/OpenAPI
- Evoluir para frontend React e Docker

---

## Licença

Projeto desenvolvido para fins educacionais e avaliação técnica.

---