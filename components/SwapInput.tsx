import React from "react";
import Image from "next/image";
import styles from "../styles/Home.module.css";

type Props = {
  type: "native" | "token";
  tokenSymbol?: string;
  tokenBalance?: string;
  current: string;
  setValue: (value: string) => void;
  max?: string;
  value: string;
  logo?: string;
};

export default function SwapInput({
  type,
  tokenSymbol,
  tokenBalance,
  setValue,
  value,
  current,
  max,
  logo,
}: Props) {
  const truncate = (value: string) => {
    if (value === undefined || value === null) return "0.00";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0.00";
    // Show more decimal places for very small balances
    if (numValue < 0.001) {
      return numValue.toFixed(8);
    } else if (numValue < 1) {
      return numValue.toFixed(6);
    } else if (numValue < 1000) {
      return numValue.toFixed(4);
    } else {
      return numValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  };

  const isActive = current === type;

  // Format value to max 8 decimal places
  const formatToMaxDecimals = (value: string): string => {
    if (!value || value === "" || value === "0") return "0";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";

    const parts = value.split(".");
    if (parts.length === 2 && parts[1].length > 8) {
      // Truncate to 8 decimal places and remove trailing zeros
      const formatted = numValue.toFixed(8);
      return formatted.replace(/\.?0+$/, "");
    }
    // Remove trailing zeros if present
    return value.replace(/\.?0+$/, "");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Allow empty input
    if (inputValue === "") {
      setValue("");
      return;
    }

    // Remove any characters that are not numbers or decimal point
    inputValue = inputValue.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = inputValue.split(".");
    if (parts.length > 2) {
      // If more than one decimal point, keep only the first one
      inputValue = parts[0] + "." + parts.slice(1).join("");
    }

    // Allow just a decimal point
    if (inputValue === ".") {
      setValue(".");
      return;
    }

    // Limit to 8 decimal places (but don't remove trailing zeros while typing)
    const partsAfterDecimal = inputValue.split(".");
    if (partsAfterDecimal.length === 2 && partsAfterDecimal[1].length > 8) {
      // Truncate to 8 decimal places only
      inputValue =
        partsAfterDecimal[0] + "." + partsAfterDecimal[1].substring(0, 8);
    }

    setValue(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point
    if (
      [8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105) &&
      e.keyCode !== 190 &&
      e.keyCode !== 110
    ) {
      e.preventDefault();
    }
  };

  const handleMaxClick = () => {
    if (max) {
      // Use the max value directly without additional formatting to preserve precision
      // Only limit to 8 decimal places if it exceeds that
      const parts = max.split(".");
      if (parts.length === 2 && parts[1].length > 8) {
        // Truncate to 8 decimal places
        const truncated = parts[0] + "." + parts[1].substring(0, 8);
        setValue(truncated);
      } else {
        // Use the value as-is to match the displayed balance exactly
        setValue(max);
      }
    } else {
      setValue("0");
    }
  };

  return (
    <div
      className={`${styles.swapInputContainer} ${
        isActive ? styles.activeInput : ""
      }`}
    >
      <input
        type="text"
        inputMode="decimal"
        placeholder="0.0"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={current !== type}
        className={styles.swapInput}
      />
      <div className={styles.inputInfo}>
        <div className={styles.tokenInfo}>
          <div className={styles.tokenSymbolContainer}>
            {logo && (
              <div
                className={`${styles.tokenLogo} ${
                  tokenSymbol === "ETH" ? styles.ethLogo : ""
                }`}
              >
                <Image
                  src={logo}
                  alt={tokenSymbol || "Token"}
                  width={24}
                  height={24}
                  className={styles.logoImage}
                />
              </div>
            )}
            <p className={styles.tokenSymbol}>{tokenSymbol}</p>
          </div>
          <p className={styles.tokenBalance}>
            Balance: {truncate(tokenBalance as string) || "0.00"}
          </p>
        </div>
        {current === type && (
          <button onClick={handleMaxClick} className={styles.maxButton}>
            MAX
          </button>
        )}
      </div>
    </div>
  );
}
