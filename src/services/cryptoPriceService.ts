/**
 * CryptoPriceService (Mock Simples)
 * 
 * Este serviço simula preços de criptomoedas em tempo real sem depender de APIs externas,
 * Redis ou banco de dados. Ideal para o ambiente do Google AI Studio para evitar erros 500.
 */
class CryptoPriceService {
  // Preços em memória (USD) baseados em valores de referência (BTC ~66.850)
  private prices: Record<string, number> = {
    'BTCUSDT': 66850.00,
    'ETHUSDT': 3450.00,
    'SOLUSDT': 145.50,
    'XRPUSDT': 0.62,
    'ADAUSDT': 0.58,
    'BNBUSDT': 580.00,
    'DOTUSDT': 9.20,
    'LINKUSDT': 18.50,
    'MATICUSDT': 0.95,
    'DOGEUSDT': 0.18
  };

  private subscriptions: Set<string> = new Set();

  /**
   * Inicializa o serviço e inicia o loop de simulação de preços.
   * @param io Instância do Socket.io (opcional no mock)
   */
  initialize(io?: any) {
    console.log('🚀 [MOCK] CryptoPriceService inicializado');
    
    // Simula atualizações de preço a cada 10 segundos para manter o dashboard "vivo"
    setInterval(() => {
      this.simulatePriceUpdates();
    }, 10000);
  }

  /**
   * Simula flutuações aleatórias nos preços para dar realismo ao mock.
   * Volatilidade controlada para evitar saltos irreais.
   */
  private simulatePriceUpdates() {
    Object.keys(this.prices).forEach(symbol => {
      const currentPrice = this.prices[symbol];
      // Volatilidade de ~0.2% por ciclo de 10s
      const volatility = currentPrice * 0.002;
      const change = (Math.random() - 0.5) * 2 * volatility;
      this.prices[symbol] = parseFloat((currentPrice + change).toFixed(2));
    });
    
    // Log para debug (visível no terminal do servidor ou console do browser)
    console.log('📊 [MOCK] Preços de Cripto Atualizados:', this.prices['BTCUSDT']);
  }

  /**
   * Retorna o preço atual de um símbolo (ex: BTC ou BTCUSDT).
   */
  getCurrentPrice(symbol: string): number | null {
    if (!symbol) return null;
    const s = symbol.toUpperCase();
    // Tenta encontrar o símbolo puro ou com o sufixo USDT
    return this.prices[s] || this.prices[`${s}USDT`] || null;
  }

  /**
   * Alias para getCurrentPrice para manter compatibilidade com controladores existentes.
   */
  getPrice(symbol: string): number | null {
    return this.getCurrentPrice(symbol);
  }

  /**
   * Mock de subscrição para compatibilidade com o fluxo de WebSocket.
   */
  addSubscription(symbol: string) {
    this.subscriptions.add(symbol.toUpperCase());
    console.log(`🔔 [MOCK] Subscrição simulada para: ${symbol}`);
  }

  /**
   * Mock de manipulação de conexão socket.
   */
  handleSocketConnection(socket: any) {
    console.log(`🔌 [MOCK] Socket conectado ao serviço de preços: ${socket.id || 'ID_MOCK'}`);
  }

  /**
   * Permite atualizar um preço manualmente (útil para testes).
   */
  async updatePrice(symbol: string, price: number) {
    const upperSymbol = symbol.toUpperCase();
    this.prices[upperSymbol] = price;
    console.log(`📝 [MOCK] Preço de ${upperSymbol} definido manualmente para ${price}`);
  }

  /**
   * Mock de erro de broadcast.
   */
  async broadcastError(symbol: string, error: string) {
    console.error(`⚠️ [MOCK] Erro simulado para ${symbol}: ${error}`);
  }
}

// Exporta uma instância única (Singleton)
export const cryptoPriceService = new CryptoPriceService();

// Auto-inicialização no frontend para garantir que o mock comece a rodar assim que importado
if (typeof window !== 'undefined') {
  cryptoPriceService.initialize();
}
