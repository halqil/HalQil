# Architecture

The HalQil platform operates as a modern monorepo driven by `pnpm` workspaces and `Turborepo`.

## High-Level Diagram

```mermaid
flowchart TD
    Client[Client App] --> Gateway[API Gateway]
    Gateway --> AIEngine[AI Engine]
    AIEngine --> Matching[Matching Service]
    Matching --> Orders[Order Management]
    Orders --> Payments[Payment & Escrow]
    Orders --> Notification[Notification Service]
```

## Structure
- `apps/web`: Next.js Web App
- `apps/api`: Express.js + Prisma API
- `apps/admin`: Admin Dashboard
- `apps/mobile`: Mobile app placeholder
