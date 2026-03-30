import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useMarketPrice = (symbol: string) => {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!symbol || !token) return;

    const fetchPrice = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/market/price/${symbol}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPrice(data.price);
        }
      } catch (error) {
        console.error('Erro ao buscar preço:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, [symbol, token]);

  return { price, isLoading };
};
