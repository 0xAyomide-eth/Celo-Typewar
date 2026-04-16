import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

export function useMiniPay() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isMiniPay, setIsMiniPay] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethProvider = (window as any).ethereum;
      if (ethProvider.isMiniPay) {
        setIsMiniPay(true);
      }
      
      const browserProvider = new BrowserProvider(ethProvider);
      setProvider(browserProvider);

      // Check if already connected
      browserProvider.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0].address);
          setIsConnected(true);
        }
      });

      // Listen for account changes
      ethProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress(null);
          setIsConnected(false);
        }
      });
    }
  }, []);

  const connect = async () => {
    if (!provider) {
      // If no provider, maybe they are not in a web3 browser
      alert("No Ethereum provider found. Please install a wallet or use MiniPay.");
      return;
    }
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Failed to connect", error);
    }
  };

  return { provider, address, isMiniPay, isConnected, connect };
}
