<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# NestJS Prisma Scaffolding

> **Branch: `variant/prisma`** — the Prisma variant of this scaffold.
>
> | Branch | ORM | Purpose |
> | --- | --- | --- |
> | `master` | TypeORM | Default template |
> | `variant/prisma` | Prisma | This branch |
>
> **These branches are parallel variants and are never merged into each other.**
> Merging this branch into `master` would delete the TypeORM template.
>
> Shared, ORM-agnostic work (guards, interceptors, config, tracing) lands on
> `master` first, then flows here with `git merge master`. Never the reverse.
>
> Prisma specifics: models live beside the module that owns them
> (`src/modules/<module>/<module>.prisma`); `prisma.config.ts` points `schema`
> at `src/modules` and picks them all up recursively. Generator and datasource
> are in `src/modules/base/base.prisma`. Migrations live in `prisma/`.

A robust, production-ready NestJS starter template with Prisma, pre-configured Authentication, Typed Configuration, and best practices baked in. Designed to save you days of setup time.

## 🚀 Features & Differentiators

What makes this scaffolding different from the standard `nest new`?

- **🔒 Advanced Authentication System**:
  - Full JWT implementation with **Access & Refresh Tokens**.
  - Built-in **Role-Based Access Control (RBAC)** guards.
  - Secure password hashing with bcrypt.
  - Pre-configured `AuthGuard` and public route decorators.

- **⚙️ Type-Safe Configuration**:
  - No more `process.env.MY_VAR` guessing.
  - Uses a custom `TypedConfigService` to provides intellisense and validation for all environment variables.
  - Split configurations for Server, Database, JWT, Email, and Client.

- **🛡️ Security First**:
  - **Helmet** for HTTP header security.
  - **CORS** pre-configured.
  - **Cookie-parser** integrated.
  - **Global Validation Pipes** with whitelist and transformation enabled.

- **💾 Database Ready**:
  - **Prisma** properly set up with Postgres (via the `@prisma/adapter-pg` driver adapter).
  - **Models co-located per module** — `src/modules/<module>/<module>.prisma`, picked up recursively from `src/modules`.
  - **Base fields** (UUID, dates, soft-delete flag) repeated per model; Prisma has no model inheritance.
  - **Repository Pattern** abstraction — repositories are the module boundary, not the client.
  - **Pagination** utilities and DTOs built-in.

- **💎 Code Quality & UX**:
  - **Global Serialization**: Automatic sensitive data exclusion (e.g., passwords) using `class-transformer` and `@Exclude`.
  - **Swagger**: Auto-generated API documentation.
  - **Modular Architecture**: Clean separation of concerns (Auth, Account modules).

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/QuangNV23062004/nestjs-typeorm-scaffolding.git
cd data-labeling-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory. You can use the provided `example-env.txt` as a template.

```bash
cp example-env.txt .env
```

**Required `.env` Variables:**

```ini
# Timezone
TZ="Asia/Ho_Chi_Minh"

# Server Configuration
API_PREFIX="api"
API_VERSION="v1"
NODE_ENV="development"
PORT=2000
SERVER_HOST="http://localhost"

# Client Configuration (CORS)
CLIENT_URL_1="http://localhost:3000"
CLIENT_URL_2="http://localhost:5173"

# Database Configuration (Postgres)
DB_TYPE="postgres"
DB_HOST="localhost"
DB_PORT=5432
DB_USERNAME="postgres"
DB_PASSWORD="your_password"
DB_NAME="your_db_name"
DB_SYNCHRONIZE=true
DB_LOGGING=true
DB_SSL=true

# JWT Configuration
JWT_ACCESS_PUBLIC_SECRET="your_access_public_key"
JWT_ACCESS_PRIVATE_SECRET="your_access_private_key"
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_PUBLIC_SECRET="your_refresh_public_key"
JWT_REFRESH_PRIVATE_SECRET="your_refresh_private_key"
JWT_REFRESH_EXPIRES_IN="30d"
JWT_RESET_PASSWORD_SECRET="your_reset_secret"
JWT_RESET_PASSWORD_EXPIRES_IN="30m"

# Email Configuration (SMTP)
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="example@gmail.com"
EMAIL_PASSWORD="your_email_password"
```

### 4. Run the Application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## 📚 API Documentation

Once the application is running, access the Swagger API documentation at:

```
http://localhost:2000/docs
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Environment Setup for Docker:**

   Create a `.env.local` file in the root directory based on the `example-env.txt`. This file will be used by Docker Compose.

   ```bash
   cp example-env.txt .env.local
   ```

   Update the database configuration in `.env.local` to match your Docker database setup if needed.

2. **Build and run the application:**

   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - API: http://localhost:2000
   - Swagger Docs: http://localhost:2000/docs

### Docker Commands

```bash
# Build the Docker image
docker build -t data-labeling-app .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Environment Variables for Docker

Create a `.env.local` file in the root directory based on the `example-env.txt`. The Docker Compose file is configured to use `.env.local` for environment variables.

### Docker Compose Configuration

The `docker-compose.yml` includes:

- **Port Mapping**: Maps container port 2000 to host port 2000
- **Volume Mounts**: Mounts the `./uploads` directory for persistent file storage
- **Networks**: Uses a custom bridge network for service isolation
- **Restart Policy**: Automatically restarts the container unless manually stopped

### Production Considerations

- **Security**: The Dockerfile runs as non-root user (`nestjs`)
- **Health Checks**: Built-in health check for container orchestration
- **Multi-stage Build**: Optimized for small production images
- **Signal Handling**: Uses `dumb-init` for proper signal handling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is [MIT licensed](LICENSE).
