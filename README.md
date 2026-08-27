# 🌾 ShambaChain

> **Turning farming activity into a verifiable financial identity for Africa’s smallholder farmers.**

ShambaChain is a **blockchain-powered agricultural credit identity system** built on the Stellar network. It enables smallholder farmers to log farming activities, build a **tamper-proof financial history**, and access fair loans and insurance without traditional banking barriers.

---

## 📦 Live Demo

### 🌐 Frontend

https://shambachain-one.vercel.app

### 🔗 Smart Contract (Testnet)

`CDQXJR6D75ZK654NUW6GX75JK7DO4HCHL6XHAMOVMDZM4SE24PNNQEVF`

### 🌍 Network

Stellar Testnet

## 🚀 Problem Statement

Across Africa, millions of farmers remain financially excluded because:

- No formal credit history  
- Lack of verifiable income records  
- High collateral requirements from lenders  
- Slow and manual loan approval systems  
- Limited access to insurance due to fraud risks  

As a result, farmers who feed nations are often locked out of financial systems.

---

## 💡 The Solution

**ShambaChain transforms agricultural activity into a digital financial identity.**

Farmers can log harvests, sales, and transactions on-chain, building a **trust-based credit profile (Shamba Score)** that lenders and insurers can verify instantly.

> “If you can farm it, you can prove it. If you can prove it, you can finance it.”

---

## ✨ Features

- Farmer onboarding with Stellar wallets
- Shamba ID generation
- Harvest and sales activity logging
- Dynamic Shamba Score generation
- Loan request and financing workflows
- QR-based farmer identity verification
- Multi-layer fraud prevention system
- USDC-powered lending infrastructure

## ⚙️ How It Works

### 🌱 1. Farmer Onboarding
- Farmers create a **Stellar wallet identity**
- Receive a unique **Shamba ID (on-chain identity)**
- Optional QR code for quick access and offline-friendly verification

---

### 📊 2. Farming Activity Logging
Farmers record key activities:

- 🌾 Harvest yield (e.g., maize, coffee, wheat)
- 💰 Sales transactions (buyer payments)
- 🚜 Farming inputs (seeds, fertilizer, labor costs)

All records are stored as **immutable blockchain transactions**.

---

### 📈 3. Shamba Score (Credit System)
A dynamic credit score is generated based on:

- Consistency of harvests  
- Income stability over time  
- Sales frequency  
- Historical activity reliability  

Farmers are categorized into tiers:
- 🟢 Bronze Farmer  
- 🔵 Silver Farmer  
- 🟡 Gold Farmer 
- 🟡 Platinum Farmer

---

### 🏦 4. Loans & Financing
- Farmers request loans directly through the platform  
- Lenders verify Shamba Score and on-chain history  
- Approved loans are disbursed instantly in **USDC via Stellar**

---

### 🛡️ 5. Insurance & Risk Assessment (Extension)
- Insurers can assess farmer reliability using on-chain data  
- Faster claim approvals  
- Reduced fraud risk and manual verification  

---

## 🛡️ 5-Layer Verification Model

ShambaChain uses a multi-layer trust system to ensure farmer records are credible and resistant to fraud.

### Layer 1 — Cryptographic Identity
Every activity is signed using the farmer's Stellar wallet.

### Layer 2 — Behavioural Analytics
The platform detects suspicious patterns and inconsistent records.

### Layer 3 — Agent Verification
Cooperative officers and field agents can attest to farming activities.

### Layer 4 — Satellite Validation
Future integration with weather and satellite crop monitoring systems.

### Layer 5 — Economic Incentives
Fraud damages reputation permanently, making honesty the most valuable strategy.

## 🌍 Why ShambaChain Matters

- 🌾 Supports smallholder farmers (Africa’s food backbone)  
- 💸 Unlocks access to fair credit and capital  
- 🔐 Builds trust through transparent financial history  
- ⚡ Enables instant global payments via Stellar  
- 📊 Turns informal agriculture into a data-driven economy  

---

## 🧠 Core Innovation

ShambaChain is not just a farming app.

It is:

> A **decentralized agricultural credit infrastructure** that converts real-world farming activity into financial identity.

---
## 🌐 Why Stellar & Soroban

ShambaChain leverages Stellar and Soroban to provide:

- Fast and low-cost transactions
- Secure wallet-based farmer identities
- Transparent and immutable activity records
- USDC-powered lending and repayments
- Smart contract automation for agricultural finance

By building on Stellar, ShambaChain enables financial inclusion at scale while keeping transaction costs affordable for smallholder farmers.

## 🖥️ Tech Stack

- ⚛️ Frontend: React / Vite
- 🌐 Blockchain: Stellar Network
- 💰 Payments: USDC on Stellar
- 🧾 Identity: Wallet-based Farmer ID system
- 🎨 UI: Modern dashboard (mobile-first design)

---

## 📂 Project Structure

```text
.
├── contract/
├── frontend/
├── README.md
├── .gitignore
├── Lisence
├── README.md
```

## 🚀 Installation & Setup

### Prerequisites

```bash
# Rust
rustup update

# WASM Target
rustup target add wasm32v1-none

# Stellar CLI
cargo install --locked stellar-cli --features opt

# Node.js v18+
node --version
```

### Clone Repository

```bash
git clone https://github.com/ShambaChain/ShambaChain.git

```
```bash
cd ShambaChain
```

### Smart Contract Setup

```bash
cd contract
```
Build the contract:

```bash
stellar contract build
```

Run tests:

```bash
cargo test
```

### Frontend Setup

```bash
cd frontend
```

Run: 

```bash
npm install
```

```bash
npm run dev
```

Application runs at:

```text
http://localhost:5173
```

## 📸 Key Features Preview

- Farmer Dashboard with Shamba Score  
- Activity logging interface (harvest & sales)  
- Loan request and approval flow  
- Lender verification dashboard  
- QR-based farmer identity system  

---

## 🔥 Demo Flow (Hackathon Pitch)

1. Farmer registers and gets a Shamba ID  
2. Logs harvest → score increases  
3. Lender views farmer profile  
4. Loan request submitted  
5. USDC loan approved and sent instantly  

> End-to-end financial empowerment in under 2 minutes.

---

## 🎯 Impact

ShambaChain bridges the gap between:

🌾 Agriculture → 💳 Finance → 🌍 Digital Identity

It brings **real financial inclusion** to farmers who have been historically excluded from banking systems.

---

## 🗺️ Roadmap

### v1 (Current MVP)
- Farmer onboarding
- Activity logging
- Shamba Score generation
- Loan request flow
- Stellar wallet integration

### v1.1
- Satellite verification
- Weather oracle integration
- Agent attestation portal

### v2
- Insurance marketplace
- Cooperative dashboards
- Multi-country expansion

### v3
- Mainnet deployment
- AI-powered agricultural risk analysis
- Pan-African farmer reputation network

## 🏆 Vision

> “A future where every farmer has a verifiable financial identity, and no good farmer is denied credit because they lack paperwork.”

---

## 📌 Built For

- Stellar Give Kenya Bootcamp  
- Real-world financial inclusion innovation  
- Web3 for social impact in Africa  

---

## 🤝 Contribution

This project is open for collaboration in:
- DeFi for agriculture  
- Identity systems  
- Financial inclusion tools  

---

## ⚡ Final Note

ShambaChain is built with one goal:

> To turn farming activity into financial freedom.

---

## License

This project is licensed under the MIT License.

---

## Author

Developed by Lukas Enock.