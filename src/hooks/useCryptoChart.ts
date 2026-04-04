import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useCryptoChart = (symbol: string, timeframe: string) => {
  const [history, setHistory] = useState<{time: string, price: number}[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!symbol) return;

    // Fetch histórico inicial
    fetch(`/api/crypto/history/${symbol}?timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data.map((d: any) => ({
            time: new Date(d.timestamp).toLocaleTimeString(),
            price: Number(d.price)
          })));
        }
      })
      .catch(err => console.error('Erro ao buscar histórico:', err));

    // Conectar Socket
    socketRef.current = io(window.location.origin);
    
    socketRef.current.on('crypto-price-update', (data: { symbol: string, price: number, timestamp: number }) => {
      if (data.symbol === symbol.toUpperCase()) {
        setHistory(prev => [...prev.slice(-1440), { 
          time: new Date(data.timestamp).toLocaleTimeString(), 
          price: data.price 
        }]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [symbol, timeframe]);

  return history;
};
