<div align="center">

# HalQil

**AI-Powered Local Services Platform for Uzbekistan**

Find trusted professionals using Artificial Intelligence.

[Website](#) · [Documentation](./Hujatlar/PRD/)

</div>

---

## Overview

HalQil is a next-generation local services marketplace tailored for the Uzbekistan market, seamlessly connecting clients with verified service providers (freelancers and organizations). Driven by Artificial Intelligence and geographical proximity, it simplifies the process of finding and booking everyday services like haircuts, auto repairs, and more.

By introducing state-of-the-art multimodal AI search (supporting text, voice, and images), HalQil eliminates the friction of traditional directories. Every transaction is protected by a transparent Escrow payment system, ensuring a reliable and safe environment for both clients and providers.

---

## Problem

The local services market currently faces several critical challenges:

* **Trust Issues:** Difficult to find reliable, high-quality, and verified professionals.
* **Lack of Transparency:** No transparent pricing, leading to hidden costs and unfair rates.
* **Unsafe Payments:** No guarantee for secure transactions or refunds in case of disputes.
* **No Digital Reputation:** Hard for honest service providers to build a consistent, verifiable portfolio and steady client flow.

---

## Solution

HalQil leverages **Artificial Intelligence** to understand natural language requests (via text, voice, or image), intelligently matching users with 100% verified providers based on category, skill, and service type. 

Every booking is secured through a robust **Escrow** mechanism that freezes funds until the service is successfully completed, ensuring complete security, transparent pricing, and a fair resolution system for any disputes.

---

## Key Features

* 🤖 **AI Search:** Multimodal search (text, voice, image) for effortless provider matching.
* 🛡️ **Identity Verification:** Mandatory verification for providers via state systems (MyID / OneID / PINFL).
* 💳 **Escrow Payments:** Secure transactions ensuring funds are only released upon job completion.
* ⭐ **Provider Rating:** A fair and transparent rating system based on completed services and reliability scores.
* 📍 **Location Privacy:** Exact locations are protected and only revealed when the provider is on the way (Location Symmetry).
* ⚡ **Smart Matching:** Lightning-fast connection (AI response time ≤ 3s) based on specific needs and geographical proximity.

---

## Architecture

```mermaid
flowchart TD
    Client[Client App] --> Gateway[API Gateway]
    Gateway --> AIEngine[AI Engine (NLP & Matching)]
    AIEngine --> Matching[Matching Service]
    Matching --> Orders[Order Management]
    Orders --> Payments[Payment & Escrow]
    Orders --> Notification[Notification Service (Push/SMS)]
```

---

## Repository Structure

```text
apps/
  ├── api/               # Backend API services
  ├── web/               # Web Application (PWA)
  ├── mobile/            # Mobile Application
packages/                # Shared internal packages (UI, config, types)
docs/                    # Technical documentation
Hujatlar/                # Project Documents (PRD, Specs)
  └── PRD/
infrastructure/          # Deployment and CI/CD scripts
```

---

## Tech Stack

*(To be filled during development)*

* **Frontend:** TBD
* **Backend:** TBD
* **Database:** TBD
* **AI:** TBD
* **Infrastructure:** TBD

---

## Getting Started

Follow these steps to set up the project locally.

```bash
# Clone the repository
git clone https://github.com/your-org/halqil.git

# Navigate into the project
cd halqil

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

---

## Documentation

* [Product Requirements Document (PRD)](./Hujatlar/PRD/HalQil%20—%20Product%20Requirements%20Document%20(PRD)%20v1.1.md)
* Architecture *(Coming Soon)*
* API Reference *(Coming Soon)*
* Database Schema *(Coming Soon)*
* UI / UX Guidelines *(Coming Soon)*

---

## Roadmap

* ✅ **PRD & Concept Approval**
* 🟡 **MVP Development (Haircut & Auto Services)**
* ⚪ **AI Integration & Testing**
* ⚪ **Mobile Apps Launch (PWA & Native)**
* ⚪ **Marketplace Expansion (New Categories)**
* ⚪ **Regional Expansion (Central Asia)**

---

## Contributing

We welcome contributions! Please review our contributing guidelines before submitting pull requests.

---

## License

This project is licensed under the [MIT License](LICENSE) (or Private).
