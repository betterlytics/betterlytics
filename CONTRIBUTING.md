# Contributing to Betterlytics

Thanks for your interest in contributing! Everyone is welcome to help out, whether it's fixing bugs, adding features, improving docs, or just sharing ideas.

## How to Contribute

- **Ideas & questions** → Start a [Discussion](https://github.com/betterlytics/betterlytics/discussions)
- **Bug reports** → [Open an Issue](https://github.com/betterlytics/betterlytics/issues)
- **Code contributions** → PRs are welcome! Just keep them focused.

If in doubt, reach out on [Discord](https://discord.gg/vwqSvPn6sP). We're always happy to help.

---

## Development Setup

### Prerequisites

- Docker (for databases)
- Node.js 18+
- Rust (latest stable)
- pnpm

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/betterlytics.git
cd betterlytics

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start databases
pnpm run compose

# Start development servers
pnpm run backend    # Port 3001
pnpm run dashboard  # Port 3000
```

## Seeding Test Data

To populate your dashboard with realistic data:

```bash
pnpm simulate $SITE_ID
```

You can customize the simulation with flags like `--events=1000`, `--users=200`, etc.

For geolocation to work, add `ENABLE_GEOLOCATION=true` and your MaxMind credentials to `.env`.

---

## Getting Help

- [Discord](https://discord.gg/vwqSvPn6sP) – Chat with us
- [Discussions](https://github.com/betterlytics/betterlytics/discussions) – Ideas & questions
- [Issues](https://github.com/betterlytics/betterlytics/issues) – Bug reports

---

## License

By contributing, you agree that your contributions will be licensed under AGPL-3.0.
