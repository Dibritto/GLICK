import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';

export const useMarketPrice = (symbol: string, type?: string) => {
  const [price, setPrice] = useState<number | null>(null);
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    console.log('useMarketPrice: Triggered. Symbol:', symbol, 'Token:', !!token);
    if (!symbol || !token) {
      console.log('useMarketPrice: Missing symbol or token', { symbol, token: !!token });
      setPrice(null);
      setName('');
      return;
    }

    setPrice(null);
    setName('');

    const fetchPrice = async () => {
      setIsLoading(true);
      console.log('useMarketPrice: Fetching price for', symbol);
      try {
        const url = new URL(`/api/market/price/${symbol}`, window.location.origin);
        if (type) {
          url.searchParams.append('type', type);
        }
        const res = await fetch(url.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const responseData = await res.json();
          console.log('useMarketPrice: responseData', responseData);
          if (responseData.success && responseData.data && responseData.data.price) {
            setPrice(responseData.data.price);
            if (responseData.data.name) {
              setName(responseData.data.name);
            }
            lastUpdateRef.current = Date.now();
          } else {
            console.warn('useMarketPrice: API returned success but no price', responseData);
          }
        } else {
          console.error('useMarketPrice: API request failed', res.status);
        }
      } catch (error) {
        console.error('Erro ao buscar preço:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchPrice();

    // Setup Socket.io
    const socket = io(window.location.origin, {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('crypto-price-update', (data: { symbol: string, price: number }) => {
      if (data.symbol.toLowerCase() === symbol.toLowerCase()) {
        setPrice(data.price);
        lastUpdateRef.current = Date.now();
      }
    });

    // Fallback polling if WS fails (no updates for > 30s)
    const fallbackInterval = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > 30000) {
        // console.log(`Fallback polling triggered for ${symbol}`);
        fetchPrice();
      }
    }, 30000);

    return () => {
      clearInterval(fallbackInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [symbol, token]);

  return { price, name, isLoading };
};
