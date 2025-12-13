# Betterlytics

<div align="center">

<img src=".github/assets/logo-dark-raw.png" alt="Betterlytics Logo" width="120">

**A modern, Cookieless & privacy-focused analytics platform built for the future**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

[![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/) [![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/) [![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/) [![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![ClickHouse](https://img.shields.io/badge/ClickHouse-FFCC01?style=flat&logo=clickhouse&logoColor=black)](https://clickhouse.com/) [![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

[Getting Started](#-getting-started) • [Dashboard](#-dashboard-preview) • [Benchmarks](#-performance-benchmarks) • [Roadmap](#️-roadmap) • [Community](#-community)

</div>

---

## Why Betterlytics?

Betterlytics is a **high-performance, privacy-first** analytics platform that puts you in control of your data. Built with modern technologies like Rust and ClickHouse, it delivers lightning-fast insights while respecting user privacy.

**Our core principles:**

- **Privacy-First**: GDPR, CCPA, and PECR compliant with no third-party tracking
- **Cookieless**: No cookies required, respects user privacy
- **Lightning Fast**: Built on Rust and ClickHouse for maximum performance
- **Lightweight Tracking**: Minimal impact on your website's performance
- **Self-Hosted**: Complete control over your data and infrastructure
- **Modern UI**: Beautiful, responsive dashboard built with Next.js 15 and React 19
- **Scalable**: Handles millions of events with ease
- **Developer Friendly**: Easy to deploy, customize, and extend

### Complete Feature Set

#### Core Analytics

| Feature                        | Description                                                             |
| ------------------------------ | ----------------------------------------------------------------------- |
| **Page Analytics**             | Detailed page views, bounce rates, and engagement metrics               |
| **Referrer Tracking**          | Complete referral source analysis and traffic attribution               |
| **Geographic Insights**        | Global visitor mapping with MaxMind GeoIP integration                   |
| **Device & Browser Insights**  | Comprehensive device, OS, and browser analytics                         |
| **UTM Campaign Insights**      | UTM parameter tracking and marketing campaign analysis                  |
| **Advanced Filtering**         | Filter data across numerous dimensions and time ranges                  |
| **User Journey Mapping**       | Visualize complete user paths through your site                         |
| **Conversion Funnels**         | Track multi-step conversion processes and drop-off points               |
| **Outbound Link Tracking**     | Automatic tracking of clicks to external websites and affiliate URLs    |
| **Custom Events**              | Track any custom interactions and business metrics                      |
| **Core Web Vitals**            | Performance metrics including LCP, FID/INP, CLS, TTFB, and more         |
| **Anonymized Session Replays** | Privacy-first replay of user interactions without storing personal data |

#### Platform & Integration

| Feature                      | Description                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Modern UI**                | Beautiful dashboard built with Next.js 15, React 19, and Tailwind CSS      |
| **Lightweight Script**       | Minimal tracking script with zero performance impact                       |
| **SPA Support**              | Full support for Single Page Applications and client-side routing          |
| **Easy Integration**         | Simple one-line script installation                                        |
| **Performance Optimized**    | Built on ClickHouse for sub-second query responses                         |
| **High-Performance Backend** | Rust-powered event processing for ultra-fast, memory-efficient performance |

## Getting Started

Choose the option that works best for you:

<table>
<tr>
<td width="50%" valign="top">

### Cloud Hosting (Recommended)

Get started instantly with our free managed cloud service:

**[Start Free →](https://betterlytics.io/register)**

- ✅ **Free forever plan** - No trial, genuinely free for small sites
- ✅ **No setup required** - Ready in 30 seconds
- ✅ **EU infrastructure** - All data processed on EU-owned cloud infrastructure
- ✅ **Automatic updates** - Always latest features
- ✅ **Managed infrastructure** - We handle scaling and maintenance
- ✅ **99.9% uptime** - Enterprise-grade reliability
- ✅ **Premium support** - Get help from our expert team
- ✅ **Automatic backups** - Your data is safe and recoverable
- ✅ **Paid plans available** - Scale up when you need more

</td>
<td width="50%" valign="top">

### Self-Hosting

Run Betterlytics on your own infrastructure for complete control and privacy.

**[Quick Setup Guide →](SETUP.md#quick-setup)**

- ✅ **Complete privacy** - Your data never leaves your servers
- ✅ **Full control** - Customize everything to your needs
- ✅ **No fees to us** - Your money goes to infrastructure providers
- ⚠️ **You manage everything** - Installation, maintenance, upgrades, security
- ⚠️ **Your responsibility** - Server capacity, uptime, backups, loading times
- ⚠️ **Infrastructure costs** - Server, CDN, backups, and associated costs

**[Setup Guide](SETUP.md#quick-setup)** | **[Docker Setup](SETUP.md#docker-setup)** | **[Development](CONTRIBUTING.md)**

</td>
</tr>
</table>

---

## Dashboard Preview

<div align="center">

### Overview

![Dashboard Overview](.github/assets/betterlytics-showcase-overview.webp)

### Geography Insights

![Real-time Analytics](.github/assets/betterlytics-showcase-geography.webp)

### User Journey Diagram

![Detailed Reports](.github/assets/betterlytics-showcase-journey.webp)

### Events and Live Event Insights

![Events Analytics](.github/assets/betterlytics-showcase-events.webp)

### Devices Breakdown

![Detailed Reports](.github/assets/betterlytics-showcase-devices.webp)

### Pages Breakdown

![Detailed Reports](.github/assets/betterlytics-showcase-pages.webp)

... and much more

</div>

## Roadmap

We're constantly working to improve Betterlytics. Here's what's coming next:

<table>
<tr>
<td width="50%" valign="top">

### In Development

| Feature               | Description                                             |
| --------------------- | ------------------------------------------------------- |
| **Docker Deployment** | One-command deployment with Docker Compose              |
| **REST API**          | Full API access for custom integrations and data export |
| **Cloud Hosting**     | Managed hosting option for easy deployment              |

</td>
<td width="50%" valign="top">

### Planned Features

| Feature                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| **Alerts & Notifications** | Custom alerts for traffic spikes and anomalies |
| **Advanced Reporting**     | Scheduled reports                              |
| **A/B Testing**            | Built-in experimentation platform              |
| **AI Insights**            | Automated insights and recommendations         |
| **Data API**               | Full API access to query your analytics data   |

</td>
</tr>
</table>

## Ideas & Suggestions

Have an idea for Betterlytics? We'd love to hear it!

- Open an [issue](https://github.com/betterlytics/betterlytics/issues) to suggest new features
- Join our discussions to share your thoughts
- Contribute code to help us build these features faster

---

## License & Attribution

This project is licensed under the [AGPL-3.0 License](LICENSE).

### Third-Party Components

Betterlytics includes components from other open source projects. See [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md) for detailed attribution and license information.

---

## Community

Join our small community of developers and privacy advocates:

- **[Discord](https://discord.gg/vwqSvPn6sP)** - Get help, share ideas, and connect with other users and developers
- **[Bluesky](https://bsky.app/profile/betterlytics.bsky.social)** - Follow us for updates and announcements
- **[GitHub Issues](https://github.com/betterlytics/betterlytics/issues)** - Report bugs and request features
- **[GitHub Discussions](https://github.com/betterlytics/betterlytics/discussions)** - Ask questions and share feedback
