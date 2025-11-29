import { ConnectButton } from "thirdweb/react";
import type { ThirdwebClient } from "thirdweb";
import Image from "next/image";
import styles from "../styles/Navbar.module.css";

type NavbarProps = {
  client: ThirdwebClient;
};

export default function Navbar({ client }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <Image
            src="/images/oni.png"
            alt="Oniswap Logo"
            width={48}
            height={48}
            className={styles.logo}
            priority
          />
        </div>
        <h1 className={styles.brandName}>Oniswap</h1>
      </div>
      <div className={styles.walletContainer}>
        <ConnectButton
          client={client}
          theme="dark"
          connectButton={{
            label: "Connect Wallet",
          }}
          connectModal={{
            title: "Connect to Oniswap",
            size: "wide",
          }}
        />
      </div>
    </nav>
  );
}
