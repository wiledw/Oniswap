import type { AppProps } from "next/app";
import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";
import { ethereum } from "thirdweb/chains";
import "../styles/globals.css";
import Navbar from "../components/Navbar";

// Create thirdweb client
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";

const client = createThirdwebClient({
  clientId: clientId,
});

// Ethereum Mainnet chain configuration
const activeChain = ethereum;

function MyApp({ Component, pageProps }: AppProps) {
  // Warn if client ID is missing (optional but recommended)
  if (typeof window !== "undefined" && !clientId) {
    console.warn(
      "Thirdweb Client ID not found. Some features may not work. " +
        "Add NEXT_PUBLIC_TEMPLATE_CLIENT_ID to your .env.local file. " +
        "Get one at https://thirdweb.com/dashboard"
    );
  }

  return (
    <ThirdwebProvider>
      <Navbar client={client} />
      <Component {...pageProps} client={client} chain={activeChain} />
    </ThirdwebProvider>
  );
}

export default MyApp;
