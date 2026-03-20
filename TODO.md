# GLICK - Plano de Implementação (Roadmap Técnico)

Este documento rastreia a implementação da arquitetura modular e do motor financeiro central do GLICK.

## 🟢 FASE 1: Core Finance Engine (Concluído)
- [x] Criar `src/lib/financeEngine.ts` para centralizar cálculos.
- [x] Implementar cálculo de **Estados do Dinheiro** (Total, Comprometido, Reservado, Livre).
- [x] Implementar cálculo de **Telemetria** (GMD, Autonomia Financeira).
- [x] Criar endpoint de API `/api/finance/core-stats`.
- [x] Integrar motor financeiro no registro de transações (`server.ts`).
- [x] Atualizar UI do Dashboard (`MainConsole.tsx`) para exibir estados e velocidade.
- [x] Refinar motor de projeção para incluir transações recorrentes e faturas futuras.

## 🟢 FASE 2: Module Manager & Estrutura Freemium (Concluído)
- [x] Criar tabela `modules` e `user_modules` no banco de dados.
- [x] Implementar `src/lib/moduleManager.ts` para gerenciar ativação/desativação de módulos.
- [x] Criar UI de "Marketplace de Módulos" para o usuário ativar extensões.
- [x] Implementar lógica de "Lock/Unlock" visual para módulos Premium.
- [x] Adicionar suporte a períodos de Trial (7/15 dias) no backend.

## 🟢 FASE 3: Módulo 1 - Finance (Free) - Concluído
- [x] Gestão essencial de contas, transações, categorias e metas.
- [x] Implementar gestão de **Transações Recorrentes** (Assinaturas, Aluguel, etc).
- [x] Integrar **Metas** como "Reservas Reais" (bloqueando saldo no motor core).
- [x] Criar visualização de **Fluxo de Caixa Projetado** (Gráfico de linha com saldo futuro).
- [x] Implementar **Estados do Dinheiro** (Reservado, Comprometido, Livre).
- [x] Implementar **Velocidade Financeira & Autonomia**.
- [x] Implementar **Conciliação Bancária**.
- [x] Implementar **Regras de Transações**.

## 🟢 FASE 4: Módulo 2 - Cripto (Paid) - Concluído
- [x] Criar tabelas `crypto_assets` e `crypto_transactions`.
- [x] Implementar integração de eventos: Compra/Venda de Cripto -> Atualiza Saldo Core.
- [x] Criar Dashboard específico de Cripto (Ativos, Preço Médio, P&L).

## 🟢 FASE 5: Módulo 3 - Investimentos (Paid) - Concluído
- [x] Criar tabelas `investments` e `investment_yields`.
- [x] Implementar gestão de Renda Fixa (CDB, Tesouro) e Renda Variável (Ações, FIIs).
- [x] Integrar eventos de rendimentos -> Atualiza Saldo Core.
- [x] Criar Dashboard de Alocação de Ativos e Rentabilidade da Carteira.

## ⚪ FASE 6: Polimento & Infraestrutura (Contínuo)
- [ ] Implementar WebSockets para atualizações em tempo real entre módulos e UI.
- [ ] Refinar Error Boundaries e tratamento de erros globais.
- [ ] Otimizar performance de queries SQL complexas no motor core.
- [ ] Garantir 100% de responsividade em todas as novas telas de módulos.
