# Betterlytics Setup Guide

<div align="center">

**Get Betterlytics running on your infrastructure in minutes**

[![Setup Guide](https://img.shields.io/badge/Setup-Guide-blue.svg)](SETUP.md)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)

[🚀 Quick Setup](#-quick-setup) • [📋 Prerequisites](#-prerequisites) • [🔧 Detailed Setup](#-detailed-setup) • [🐳 Docker](#-docker-setup)

</div>

---

## 🚀 Quick Setup

Get up and running in under 5 minutes:

<table>
<tr>
<td width="50%" valign="top">

### ⚡ Express Setup

```bash
git clone https://github.com/Lindharden/better-analytics.git
cd better-analytics
pnpm install
pnpm run compose
pnpm run backend
pnpm run dashboard
```

**That's it!** Your dashboard will be available at:

- 📊 **Dashboard**: `http://localhost:3000`
- 🔍 **ClickHouse**: `http://localhost:8123/play`

</td>
<td width="50%" valign="top">

### ✅ What This Does

- 🐳 **Starts Docker services** (ClickHouse, PostgreSQL)
- 📦 **Installs dependencies** for all components
- 🗃️ **Runs database migrations** automatically
- 🌱 **Seeds sample data** for testing
- 🚀 **Generates Prisma client** for the dashboard

**Next step**: Login to your dashboard using the login credentials defined in your dashboard/.env configuration file.

</td>
</tr>
</table>

---

## 📋 Prerequisites

Before you begin, ensure you have these tools installed:

<table>
<tr>
<td width="25%" align="center">

### 🐳 Docker

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**Required for databases**

- Docker Desktop (recommended)
- Docker Compose included

</td>
<td width="25%" align="center">

### 🟢 Node.js

[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**v18 or later**

- Dashboard frontend
- Build tools

</td>
<td width="25%" align="center">

### 🦀 Rust

[![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)

**Latest stable**

- Backend server
- High-performance analytics

</td>
<td width="25%" align="center">

### 📦 pnpm

[![pnpm](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)](https://pnpm.io/)

**Package manager**

- Fast installs
- Workspace support

</td>
</tr>
</table>

---

## 🔧 Detailed Setup

### 1️⃣ Clone & Navigate

```bash
git clone https://github.com/Lindharden/better-analytics.git
cd better-analytics
```

### 2️⃣ Environment Configuration

<table>
<tr>
<td width="33%" valign="top">

#### 🌍 Root Environment

```bash
cp .env.example .env
```

**Contains**: Database URLs, general config

</td>
<td width="33%" valign="top">

#### ⚙️ Backend Environment

```bash
cp backend/.env.example backend/.env
```

**Contains**: Rust server config, API keys

</td>
<td width="33%" valign="top">

#### 🎨 Dashboard Environment

```bash
cp dashboard/.env.example dashboard/.env
```

**Contains**: Next.js config, API endpoints

</td>
</tr>
</table>

> 💡 **Tip**: Default values work for local development. Only modify if you have specific requirements or are deploying locally for production use.

### 3️⃣ Install Dependencies

```bash
pnpm install
```

### 4️⃣ Start Infrastructure

```bash
pnpm run compose
```

<details>
<summary><strong>🔍 What services start?</strong></summary>

| Service        | Port       | Purpose            | Access                       |
| -------------- | ---------- | ------------------ | ---------------------------- |
| **ClickHouse** | 8123, 9000 | Analytics database | `http://localhost:8123/play` |
| **PostgreSQL** | 5432       | Dashboard database | Connection string in `.env`  |

**Data persistence**: All data is stored in `./data/` directory

</details>

### 5️⃣ Start Backend Server

```bash
pnpm run backend
```

### 6️⃣ Start Dashboard

```bash
pnpm run dashboard
```

---

## 🐳 Docker Setup

### 🎯 Production-Ready Deployment

<table>
<tr>
<td width="50%" valign="top">

#### 🚀 Express Docker Start

```bash
# Start all services
pnpm super command TODO
```

**Perfect for**: Production deployments, CI/CD

</td>
<td width="50%" valign="top">

#### 🔧 Development Mode

```bash
# Start with rebuild
pnpm run compose

# Reset everything
docker-compose down -v
```

**Perfect for**: Development, testing, debugging

</td>
</tr>
</table>

---

<div align="center">

**Need help?** Join our [Discord](https://discord.gg/vwqSvPn6sP) or [open an issue](https://github.com/Lindharden/better-analytics/issues)

Made with ❤️ by the Betterlytics team

</div>
