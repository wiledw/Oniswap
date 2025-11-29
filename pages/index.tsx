import {
  useActiveAccount,
  useReadContract,
  useWalletBalance,
  useSendTransaction,
} from "thirdweb/react";
import { getContract } from "thirdweb/contract";
import { prepareContractCall } from "thirdweb";
import { toEther, toWei } from "thirdweb/utils";
import type { ThirdwebClient, Chain } from "thirdweb";
import styles from "../styles/Home.module.css";
import { NextPage } from "next";
import { useEffect, useState, useMemo } from "react";
import SwapInput from "../components/SwapInput";
import Toast from "../components/Toast";

type HomeProps = {
  client: ThirdwebClient;
  chain: Chain;
};

const Home: NextPage<HomeProps> = ({ client, chain }) => {
  // Contracts for the DEX and the token
  const TOKEN_CONTRACT = "YOUR TOKEN CONTRACT ADDRESS";
  const DEX_CONTRACT = "YOUR DEX CONTRACT ADDRESS";

  // Get the address of the connected account
  const account = useActiveAccount();
  const address = account?.address;

  // Get contract instances
  const tokenContract = getContract({
    client,
    chain,
    address: TOKEN_CONTRACT,
  });

  const dexContract = getContract({
    client,
    chain,
    address: DEX_CONTRACT,
  });

  // Get token symbol
  const { data: symbol } = useReadContract({
    contract: tokenContract,
    method: "function symbol() view returns (string)",
  });

  // Get token decimals
  const { data: tokenDecimals } = useReadContract({
    contract: tokenContract,
    method: "function decimals() view returns (uint8)",
  });

  // Debug: Log token decimals when available
  useEffect(() => {
    if (tokenDecimals !== undefined) {
      console.log("Token decimals:", Number(tokenDecimals));
    }
  }, [tokenDecimals]);

  // Get token balance for user
  const { data: tokenBalanceData } = useWalletBalance({
    address: address || undefined,
    chain,
    tokenAddress: TOKEN_CONTRACT,
    client,
  });

  // Get token balance for DEX contract
  const { data: contractTokenBalanceData } = useWalletBalance({
    address: DEX_CONTRACT,
    chain,
    tokenAddress: TOKEN_CONTRACT,
    client,
  });

  // State for the contract balance and the values to swap
  const [contractBalance, setContractBalance] = useState<String>("0");
  const [nativeValue, setNativeValue] = useState<String>("0");
  const [tokenValue, setTokenValue] = useState<String>("0");
  const [currentFrom, setCurrentFrom] = useState<String>("native");
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Get native balance
  const { data: nativeBalanceData } = useWalletBalance({
    address: address || undefined,
    chain,
    client,
  });

  // Convert token amount to smallest unit based on token decimals
  const tokenToSmallestUnit = (value: string): string => {
    const decimals = Number(tokenDecimals) || 18; // Default to 18 if not available
    if (!value || value === "0" || value === "") return "0";

    // Handle decimal point properly
    const parts = value.split(".");
    const integerPart = parts[0] || "0";
    const decimalPart = parts[1] || "";

    // Pad or truncate decimal part to match token decimals
    let paddedDecimal = decimalPart;
    if (paddedDecimal.length < decimals) {
      paddedDecimal = paddedDecimal.padEnd(decimals, "0");
    } else if (paddedDecimal.length > decimals) {
      paddedDecimal = paddedDecimal.substring(0, decimals);
    }

    // Combine integer and decimal parts, then convert to BigInt
    const valueInSmallestUnit = BigInt(integerPart + paddedDecimal);
    return valueInSmallestUnit.toString();
  };

  // Get the amount of tokens to get based on the value to swap
  // Memoize params to ensure useReadContract detects changes
  const swapParams = useMemo(() => {
    if (currentFrom === "native") {
      const ethAmount = BigInt(toWei((nativeValue as string) || "0"));
      const ethReserve = BigInt(toWei((contractBalance as string) || "0"));
      const tokenReserve = contractTokenBalanceData?.value || BigInt(0);

      console.log("ETH to Token swap params:", {
        inputAmount: ethAmount.toString(),
        inputReserve: ethReserve.toString(),
        outputReserve: tokenReserve.toString(),
        nativeValue,
        contractBalance,
      });

      return [ethAmount, ethReserve, tokenReserve] as const;
    } else {
      const tokenAmount = tokenToSmallestUnit((tokenValue as string) || "0");
      const tokenReserve = contractTokenBalanceData?.value || BigInt(0);
      const ethReserve = BigInt(toWei((contractBalance as string) || "0"));

      console.log("Token to ETH swap params:", {
        inputAmount: tokenAmount,
        inputAmountBigInt: BigInt(tokenAmount).toString(),
        inputReserve: tokenReserve.toString(),
        outputReserve: ethReserve.toString(),
        tokenValue,
        tokenDecimals: Number(tokenDecimals),
        contractBalance,
        contractTokenBalance: tokenReserve.toString(),
      });

      return [BigInt(tokenAmount), tokenReserve, ethReserve] as const;
    }
  }, [
    currentFrom,
    nativeValue,
    tokenValue,
    contractBalance,
    contractTokenBalanceData?.value,
    tokenDecimals,
  ]);

  const { data: amountToGet } = useReadContract({
    contract: dexContract,
    method:
      "function getAmountOfTokens(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) view returns (uint256)",
    params: swapParams,
  });

  const { mutate: sendTransaction } = useSendTransaction();

  // Fetch the contract balance directly from provider (bypasses thirdweb RPC)
  const fetchContractBalance = async () => {
    if (!DEX_CONTRACT) return;

    try {
      // Use ethers directly with MetaMask provider - bypasses thirdweb RPC
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const { ethers } = await import("ethers");
        const ethersProvider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
        const balance = await ethersProvider.getBalance(DEX_CONTRACT);
        const balanceInEth = ethers.utils.formatEther(balance);
        setContractBalance(balanceInEth);
      }
    } catch (error) {
      console.error("Error fetching contract balance:", error);
      setContractBalance("0");
    }
  };

  // Execute the swap
  // This function will swap the token to native or the native to the token
  const executeSwap = async () => {
    if (
      parseFloat(nativeValue as string) <= 0 &&
      parseFloat(tokenValue as string) <= 0
    ) {
      return;
    }

    if (!account) {
      showToast("Please connect your wallet first", "info");
      return;
    }

    setIsLoading(true);
    try {
      if (currentFrom === "native") {
        const transaction = prepareContractCall({
          contract: dexContract,
          method: "function swapEthTotoken() payable",
          value: BigInt(toWei((nativeValue as string) || "0")),
        });

        await sendTransaction(transaction);
        // Reset values after successful swap
        setNativeValue("0");
        setTokenValue("0");
        showToast("Swap executed successfully!", "success");
      } else {
        // Approve token spending
        const tokenAmount = BigInt(
          tokenToSmallestUnit((tokenValue as string) || "0")
        );
        const approveTransaction = prepareContractCall({
          contract: tokenContract,
          method:
            "function approve(address spender, uint256 amount) returns (bool)",
          params: [DEX_CONTRACT, tokenAmount],
        });

        await sendTransaction(approveTransaction);

        // Wait a bit for approval to be mined
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Swap token to native
        const swapTransaction = prepareContractCall({
          contract: dexContract,
          method:
            "function swapTokenToEth(uint256 tokenAmount) returns (uint256)",
          params: [tokenAmount],
        });

        await sendTransaction(swapTransaction);
        // Reset values after successful swap
        setNativeValue("0");
        setTokenValue("0");
        showToast("Swap executed successfully!", "success");
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error?.message || "An error occurred while trying to execute the swap";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balance directly from wallet provider (bypasses thirdweb RPC)
  const fetchBalanceFromWallet = async () => {
    if (!address) {
      setNativeBalance(null);
      return;
    }

    setIsBalanceLoading(true);
    try {
      // Use ethers directly with MetaMask provider - bypasses thirdweb RPC completely
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const { ethers } = await import("ethers");
        const ethereum = (window as any).ethereum;

        // Request account access if needed
        await ethereum.request({ method: "eth_requestAccounts" });

        const ethersProvider = new ethers.providers.Web3Provider(ethereum);
        const balance = await ethersProvider.getBalance(address);
        const balanceInEth = ethers.utils.formatEther(balance);

        // Format to max 8 decimal places
        const numBalance = parseFloat(balanceInEth);
        const formattedBalance = numBalance.toFixed(8).replace(/\.?0+$/, "");
        setNativeBalance(formattedBalance);
      } else {
        setNativeBalance("0");
      }
    } catch (error) {
      console.error("Error fetching balance from wallet:", error);
      setNativeBalance("0");
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Update native balance from hook if available
  useEffect(() => {
    if (nativeBalanceData?.displayValue) {
      setNativeBalance(nativeBalanceData.displayValue);
    } else if (address) {
      fetchBalanceFromWallet();
    }
  }, [nativeBalanceData, address]);

  // Fetch the contract balance and update it every 10 seconds
  useEffect(() => {
    if (address) {
      fetchContractBalance();

      // Set up interval to refresh balance every 10 seconds
      const interval = setInterval(() => {
        fetchContractBalance();
        if (!nativeBalanceData) {
          fetchBalanceFromWallet();
        }
      }, 10000);
      return () => clearInterval(interval);
    } else {
      // Reset balance when disconnected
      setNativeBalance(null);
    }
  }, [address, nativeBalanceData]);

  // Format number to max 8 decimal places
  const formatToMaxDecimals = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";
    const parts = value.split(".");
    if (parts.length === 2 && parts[1].length > 8) {
      return numValue.toFixed(8);
    }
    return value;
  };

  // Update the amount to get based on the value
  useEffect(() => {
    const inputValue = currentFrom === "native" ? nativeValue : tokenValue;

    // Debug logging
    if (currentFrom === "token" && tokenValue && tokenValue !== "0") {
      console.log("Token to ETH calculation:", {
        tokenValue,
        amountToGet: amountToGet?.toString(),
        contractTokenBalance: contractTokenBalanceData?.value?.toString(),
        contractBalance,
        tokenDecimals,
      });
    }

    // If the input value is "0" or empty, reset the output value
    if (
      !inputValue ||
      inputValue === "0" ||
      inputValue === "" ||
      parseFloat(inputValue as string) <= 0
    ) {
      if (currentFrom === "native") {
        setTokenValue("0");
      } else {
        setNativeValue("0");
      }
      return;
    }

    // Check if reserves are available
    if (
      !contractTokenBalanceData?.value ||
      !contractBalance ||
      parseFloat(contractBalance as string) <= 0
    ) {
      // Reserves not loaded yet, don't update
      console.log("Reserves not loaded yet");
      return;
    }

    // If amountToGet is undefined or null, don't update yet (calculation might be in progress)
    if (amountToGet === undefined || amountToGet === null) {
      console.log("amountToGet is undefined/null");
      return;
    }

    // Only update if amountToGet is greater than 0
    if (amountToGet === BigInt(0)) {
      console.log("amountToGet is 0");
      if (currentFrom === "native") {
        setTokenValue("0");
      } else {
        setNativeValue("0");
      }
      return;
    }

    const etherValue = toEther(amountToGet);
    const formatted = formatToMaxDecimals(etherValue);
    console.log(
      "Setting ETH value:",
      formatted,
      "from amountToGet:",
      amountToGet.toString()
    );
    if (currentFrom === "native") {
      setTokenValue(formatted);
    } else {
      setNativeValue(formatted);
    }
  }, [
    amountToGet,
    currentFrom,
    nativeValue,
    tokenValue,
    contractTokenBalanceData?.value,
    contractBalance,
    tokenDecimals,
  ]);

  // Convert token balance from smallest unit to display value (preserving precision)
  const convertTokenBalance = (
    value: bigint | undefined,
    decimals: number | bigint | undefined
  ): string => {
    if (!value || value === BigInt(0)) return "0";
    const tokenDecimalsNum = Number(decimals) || 18;
    const divisor = BigInt(10 ** tokenDecimalsNum);
    const quotient = value / divisor;
    const remainder = value % divisor;

    // Convert remainder to decimal string with proper padding
    const remainderStr = remainder.toString().padStart(tokenDecimalsNum, "0");

    // Remove trailing zeros but keep at least one decimal place if there's a remainder
    const decimalPart = remainderStr.replace(/0+$/, "");

    if (decimalPart === "") {
      return quotient.toString();
    }

    // Return with decimal part, preserving precision up to token decimals
    const result = `${quotient}.${decimalPart}`;
    return result;
  };

  // Use raw balance conversion for MAX button, displayValue for display
  const tokenBalance = tokenBalanceData?.displayValue || "0.00";
  const tokenBalanceRaw = tokenBalanceData?.value
    ? convertTokenBalance(tokenBalanceData.value, tokenDecimals)
    : tokenBalance;

  return (
    <main className={styles.main}>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <div className={styles.container}>
        <div className={styles.swapCard}>
          <div className={styles.swapInputsWrapper}>
            {currentFrom === "native" ? (
              <>
                <SwapInput
                  current={currentFrom as string}
                  type="native"
                  max={nativeBalance || "0"}
                  value={nativeValue as string}
                  setValue={setNativeValue}
                  tokenSymbol="ETH"
                  tokenBalance={nativeBalance || "0.00"}
                  logo="/images/eth.jpg"
                />
                <button
                  onClick={() => {
                    // Swap values when toggling
                    const tempNative = nativeValue;
                    const tempToken = tokenValue;
                    setNativeValue(tempToken);
                    setTokenValue(tempNative);
                    setCurrentFrom("token");
                  }}
                  className={styles.toggleButton}
                  aria-label="Swap direction"
                >
                  ↕
                </button>
                <SwapInput
                  current={currentFrom as string}
                  type="token"
                  max={tokenBalanceRaw}
                  value={tokenValue as string}
                  setValue={setTokenValue}
                  tokenSymbol={(symbol as string) || "67"}
                  tokenBalance={tokenBalance}
                  logo="/images/67.png"
                />
              </>
            ) : (
              <>
                <SwapInput
                  current={currentFrom as string}
                  type="token"
                  max={tokenBalanceRaw}
                  value={tokenValue as string}
                  setValue={setTokenValue}
                  tokenSymbol={(symbol as string) || "67"}
                  tokenBalance={tokenBalance}
                  logo="/images/67.png"
                />
                <button
                  onClick={() => {
                    // Swap values when toggling
                    const tempNative = nativeValue;
                    const tempToken = tokenValue;
                    setNativeValue(tempToken);
                    setTokenValue(tempNative);
                    setCurrentFrom("native");
                  }}
                  className={styles.toggleButton}
                  aria-label="Swap direction"
                >
                  ↕
                </button>
                <SwapInput
                  current={currentFrom as string}
                  type="native"
                  max={nativeBalance || "0"}
                  value={nativeValue as string}
                  setValue={setNativeValue}
                  tokenSymbol="ETH"
                  tokenBalance={nativeBalance || "0.00"}
                  logo="/images/eth.jpg"
                />
              </>
            )}
          </div>
          {address ? (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={executeSwap}
                disabled={
                  (isLoading as boolean) ||
                  ((nativeValue === "0" ||
                    nativeValue === "" ||
                    parseFloat(nativeValue as string) <= 0) &&
                    (tokenValue === "0" ||
                      tokenValue === "" ||
                      parseFloat(tokenValue as string) <= 0))
                }
                className={styles.swapButton}
              >
                {isLoading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span className={styles.loadingSpinner}></span>
                    Processing...
                  </span>
                ) : (
                  "Swap"
                )}
              </button>
            </div>
          ) : (
            <p className={styles.connectMessage}>Connect wallet to exchange</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;
