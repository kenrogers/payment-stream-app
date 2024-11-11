# Stacks Smart Contract Crowdfunding and Dividend App (4th Place Project at Easy A x Stacks Harvard Hackathon 2024)
A decentralized application for crowdfunding and paying dividends using smart contracts on Stacks, with a theme of investment into renewable energy resources for Data Center power consumption.
## Prerequisites
- [Leather Wallet](https://leather.io/) browser extension
- Node.js 16+ and npm/yarn
- Local [Stacks devnet](https://docs.hiro.so/stacks/clarinet/guides/run-a-local-devnet) running
## Setup
1. Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd repo-name
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
<img width="674" alt="Screenshot 2024-11-10 at 23 25 55" src="https://github.com/user-attachments/assets/658c7440-0849-4fd8-bbe5-a75eb1054ca7">

   - Click "Connect Leather Wallet"
   - Approve the connection request

2. **Enter Funding Goal Amount**
<img width="677" alt="Screenshot 2024-11-10 at 23 26 28" src="https://github.com/user-attachments/assets/a1b14654-dede-47e6-8fbc-8f0820f1c199">

   - Enter the amount of STX you want to crowdfund
   - Click "Set Funding Goal"

3. **Add Contributor Pledges**
<img width="698" alt="Screenshot 2024-11-10 at 23 27 23" src="https://github.com/user-attachments/assets/b88b0a68-7b59-4eeb-8551-ce0b97c46692">

   - Enter the contributor's Stacks address
   - Enter the amount they pledge to contribute
@@ -55,8 +58,11 @@ clarinet devnet start
   - For ease of using the user's own address, click "Use My Address"

4. **Pay Out Dividends**
<img width="691" alt="Screenshot 2024-11-10 at 23 27 41" src="https://github.com/user-attachments/assets/9a46f3b3-0ce4-43f2-898a-2477d72b7964">

   - Enter the amount of Stacks earned by leasing the power
   - Click "Process Consumption" to show dividend payout for each user address
<img width="678" alt="Screenshot 2024-11-10 at 23 27 51" src="https://github.com/user-attachments/assets/616f5a79-d241-4ebc-818b-912c929ad1fb">

## Development

The app uses:
- Next.js 13+ with App Router
- Stacks.js for blockchain interactions
- Shadcn/ui components
- TypeScript
## Contract Addresses (Devnet)
- GreenChain Contract: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.greenchain`
