import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

export function useMiniPay() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isMiniPay, setIsMiniPay] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ethProvider = (window as any).ethereum;
      if (ethProvider) {
        if (ethProvider.isMiniPay) {
          setIsMiniPay(true);
        }
        
        // Auto-check if already connected via injected wallet
        const checkInjectedConnection = async () => {
          try {
            const browserProvider = new BrowserProvider(ethProvider);
            const accounts = await browserProvider.listAccounts();
            if (accounts.length > 0) {
              setProvider(browserProvider);
              setAddress(accounts[0].address);
              setIsConnected(true);
            }
          } catch(e) {}
        };
        checkInjectedConnection();

        ethProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            setProvider(new BrowserProvider(ethProvider));
          } else {
            setAddress(null);
            setIsConnected(false);
          }
        });
      }
    }
  }, []);

  const connect = async () => {
    const ethProvider = (window as any).ethereum;
    if (!ethProvider) {
      alert("No web3 wallet found. Please install MetaMask, or open this site in Opera Mini to use MiniPay.");
      return;
    }
    
    try {
      const browserProvider = new BrowserProvider(ethProvider);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setProvider(browserProvider);
        setAddress(accounts[0]);
        setIsConnected(true);

        // Attempt to switch to Celo Mainnet automatically
        try {
          await browserProvider.send("wallet_switchEthereumChain", [{ chainId: "0xa4ec" }]);
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to the wallet.
          if (switchError.code === 4902) {
            await browserProvider.send("wallet_addEthereumChain", [{
              chainId: "0xa4ec",
              chainName: "Celo Mainnet",
              nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
              rpcUrls: ["https://forno.celo.org"],
              blockExplorerUrls: ["https://celoscan.io/"]
            }]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to connect", error);
    }
  };

  return { provider, address, isMiniPay, isConnected, connect };
}
