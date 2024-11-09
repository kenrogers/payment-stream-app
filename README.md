# BTC Payment Stream App

A decentralized application for creating Bitcoin payment streams using sBTC on Stacks.

## Prerequisites

- [Leather Wallet](https://leather.io/) browser extension
- Node.js 16+ and npm/yarn
- Local [Stacks devnet](https://docs.hiro.so/stacks/clarinet/guides/run-a-local-devnet) running

## Setup

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd btc-payment-stream
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Start the local Stacks devnet:

```bash
# In a separate terminal
cd contracts
clarinet devnet start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Connect Wallet**

   - Click "Connect Leather Wallet"
   - Approve the connection request

2. **Deposit BTC**

   - Enter the amount of BTC you want to stream
   - Click "Deposit BTC" (this uses mock BTC on devnet)
   - Approve the sBTC mint transaction in your wallet

3. **Create Stream**

   - Enter the recipient's Stacks address
   - Set the stream duration in days
   - Click "Create Stream"
   - Approve the stream creation transaction

4. **Monitor Streams**
   - View active streams in the dashboard
   - Track remaining and received balances
   - Switch between sender and recipient views
   - Balances update automatically every 5 seconds

## Development

The app uses:

- Next.js 13+ with App Router
- Stacks.js for blockchain interactions
- Shadcn/ui components
- TypeScript

## Contract Addresses (Devnet)

- sBTC Token: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token`
- Stream Contract: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stream`
