# Oniswap

A decentralized exchange (DEX) built with Next.js and Thirdweb that enables seamless swapping between Ethereum (ETH) and a custom ERC-20 token. Oniswap implements an Automated Market Maker (AMM) model similar to Uniswap, providing real-time price calculations and secure on-chain swaps.

## Features

- 🔄 **Token Swapping**: Swap between ETH and custom ERC-20 tokens
- 💰 **Real-time Pricing**: Instant price calculations based on current liquidity reserves
- 🔐 **Wallet Integration**: Connect with MetaMask or any Web3 wallet via Thirdweb
- 📊 **Live Balances**: Real-time balance updates for both ETH and tokens
- ⚡ **Gas Optimized**: Efficient contract calls and minimal re-renders
- 🎨 **Modern UI**: Clean, responsive interface with smooth user experience
- 🔍 **Transaction Transparency**: All transactions are verifiable on Etherscan

## Smart Contracts

Oniswap interacts with two deployed smart contracts on Ethereum:

- **Token Contract**: `0x2FC834EefF1F7553a491ba223FAfC6597Ccb4628`
  - ERC-20 token with symbol "67"
  - Handles token transfers and approvals

- **DEX Contract**: `0x5514Dc256AD47Db3f9989a07fFCF79bba0E762B3`
  - Manages liquidity pools
  - Executes swaps using AMM formula
  - Functions: `swapEthTotoken()`, `swapTokenToEth()`, `getAmountOfTokens()`

## Tech Stack

- **Framework**: Next.js 13
- **Blockchain SDK**: Thirdweb v5
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Ethereum Provider**: ethers.js v5

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- A Web3 wallet (MetaMask recommended)
- Thirdweb Client ID (optional but recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Oniswap
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_TEMPLATE_CLIENT_ID=your_thirdweb_client_id
```

You can get a free Thirdweb Client ID from [thirdweb.com/dashboard](https://thirdweb.com/dashboard)

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the top right corner and connect your MetaMask or other Web3 wallet

2. **Swap ETH to Token**:
   - Enter the amount of ETH you want to swap
   - The app automatically calculates how many tokens you'll receive
   - Click "Swap" and confirm the transaction in your wallet

3. **Swap Token to ETH**:
   - Click the toggle button (↕) to switch swap direction
   - Enter the amount of tokens you want to swap
   - Click "Swap" - you'll need to approve the transaction first, then confirm the swap

4. **View Balances**: Your ETH and token balances are displayed at the top of each input field and update automatically after transactions

## How It Works

### Token Contract Interaction

The app reads from the token contract using Thirdweb hooks:
- `useReadContract` to fetch token metadata (`symbol()`, `decimals()`)
- `useWalletBalance` to display user token balances
- `approve()` function call before token-to-ETH swaps to grant spending allowance

### DEX Contract Interaction

The DEX contract manages liquidity and executes swaps:
- Reads ETH and token reserves to calculate exchange rates
- Calls `getAmountOfTokens()` with current reserves for real-time pricing
- Executes swaps: `swapEthTotoken()` for ETH→Token or `swapTokenToEth()` for Token→ETH
- Contract balances refresh every 10 seconds to maintain accurate pricing

### Blockchain Integration

- **Reading Data**: Uses Thirdweb hooks (`useReadContract`, `useWalletBalance`) for view calls (no gas required)
- **Writing Data**: Uses `useSendTransaction` with `prepareContractCall` to format and send transactions
- **Wallet Connection**: Thirdweb's `ConnectButton` integrates with Web3 providers
- **Balance Fetching**: Uses ethers.js directly to bypass RPC limitations when needed

## Project Structure

```
Oniswap/
├── components/
│   ├── Navbar.tsx          # Navigation bar with wallet connection
│   ├── SwapInput.tsx       # Input component for swap amounts
│   └── Toast.tsx           # Notification component
├── pages/
│   ├── _app.tsx            # App wrapper with ThirdwebProvider
│   └── index.tsx           # Main swap interface
├── styles/
│   ├── globals.css         # Global styles
│   ├── Home.module.css     # Main page styles
│   ├── Navbar.module.css   # Navbar styles
│   └── Toast.module.css    # Toast notification styles
└── public/
    └── images/             # Token logos and assets
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and deploy to IPFS via Thirdweb

## Key Features Explained

### Real-time Price Calculation

The app uses the AMM formula to calculate swap amounts:
```
outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount)
```

This calculation happens instantly as you type, using the current reserves from the DEX contract.

### Decimal Handling

The app properly handles token decimals (defaults to 18) by converting between human-readable amounts and blockchain units (wei for ETH, smallest unit for tokens).

### Transaction Flow

1. User enters swap amount
2. App calculates output using `getAmountOfTokens()`
3. User clicks "Swap"
4. For token swaps: `approve()` transaction first
5. Swap transaction sent via `useSendTransaction`
6. User confirms in wallet
7. Transaction processed on blockchain
8. UI updates automatically

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_TEMPLATE_CLIENT_ID` | Thirdweb Client ID | Optional (recommended) |

## Troubleshooting

- **Wallet not connecting**: Make sure MetaMask or another Web3 wallet is installed
- **Transactions failing**: Ensure you have sufficient ETH for gas fees
- **Balance not updating**: Refresh the page or wait a few seconds for automatic updates
- **Price calculation errors**: Check that the DEX contract has sufficient liquidity

## Learn More

- [Thirdweb React Documentation](https://docs.thirdweb.com/react)
- [Thirdweb TypeScript Documentation](https://docs.thirdweb.com/typescript)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ethereum Documentation](https://ethereum.org/en/developers/docs/)

## License

See [LICENSE.md](LICENSE.md) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js and Thirdweb
