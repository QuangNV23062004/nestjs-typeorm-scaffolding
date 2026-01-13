<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# NestJS TypeORM Scaffolding

A robust, production-ready NestJS starter template with TypeORM, pre-configured Authentication, Typed Configuration, and best practices baked in. Designed to save you days of setup time.

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
  - **TypeORM** properly set up with Postgres.
  - **Base Entity** pattern with common fields (UUID, dates).
  - **Repository Pattern** abstraction.
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
# Server Configuration
API_PREFIX="/api"
API_VERSION="v1"
NODE_ENV="development"
PORT=2000

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

# JWT Configuration
JWT_ACCESS_PUBLIC_SECRET="your_access_public_key"
JWT_ACCESS_PRIVATE_SECRET="your_access_private_key"
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_PUBLIC_SECRET="your_refresh_public_key"
JWT_REFRESH_PRIVATE_SECRET="your_refresh_private_key"
JWT_REFRESH_EXPIRES_IN="30d"

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is [MIT licensed](LICENSE).
