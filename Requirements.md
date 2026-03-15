# GLICK - Sistema de Gestão Financeira Pessoal Avançado

## Visão Geral
O GLICK é um console de decisão financeira diária projetado para oferecer controle total, clareza de dados e previsibilidade de saldo. A interface é inspirada em cockpits técnicos, priorizando a densidade de informações e o monitoramento constante.

## Requisitos Funcionais

### 1. Gestão de Contas e Cartões
- Suporte a múltiplos tipos de conta (Corrente, Digital, Carteira, Investimento).
- Gestão de cartões de crédito com controle de limite e datas de fechamento/vencimento.
- Transferências entre contas.

### 2. Controle de Transações
- Registro de Receitas, Despesas e Transferências.
- Categorização hierárquica (Categoria -> Subcategoria).
- Status de transação: pendente, confirmado, reconciliado.
- Despesas recorrentes (mensal, semanal, anual).

### 3. Inteligência e Previsão
- **Saldo Projetado:** Cálculo automático do saldo final do mês baseado em receitas e despesas futuras.
- **Estado do Dinheiro:** Classificação em Comprometido, Reservado e Livre.
- **Velocidade do Dinheiro:** Cálculo de gasto médio diário e autonomia financeira (dias restantes).

### 4. Metas e Alertas
- Definição de metas financeiras com acompanhamento de progresso.
- Sistema de alertas para vencimentos, saldo baixo e gastos elevados.

### 5. Usabilidade
- **Tooltips Informativos:** Explicações detalhadas para cada KPI na barra superior e barra lateral ao passar o mouse.
- **Responsividade Total:** Interface adaptável para dispositivos móveis, tablets e desktops, com menu lateral retrátil e empilhamento inteligente de painéis.
- **Visualização de Dados:** Gráficos interativos de fluxo de gastos utilizando Recharts.
- **SEO Profissional:** Estrutura semântica HTML5, meta tags otimizadas e dados estruturados JSON-LD.
- **Sistema de Modais:** Interface de entrada rápida para receitas e despesas com validação visual.
- **Lista de Transações:** Visualização detalhada das movimentações recentes com filtros rápidos.
- **Refinamento de Usabilidade:** Tooltips corrigidos para evitar clipping, contraste de cores aprimorado para legibilidade técnica e targets de interação otimizados.
- **Console Modular:** Implementação completa das visões de Movimentações, Contas, Cartões, Metas, Categorias e Relatórios Inteligentes.
- **Marketplace de Módulos:** Sistema de descoberta e ativação de extensões premium (Investimentos, etc).
- **Estabilidade Técnica:** Implementação de Error Boundaries e tratamento de falhas de API para garantir resiliência do sistema.
- **Integração Full-Stack:** Backend Express configurado com Knex.js para persistência em banco de dados SQL, permitindo sincronização real de transações e contas.
- **Persistência de Dados:** Implementação de rotas de API para CRUD de transações, gestão de contas e catálogo de módulos.
- **Inicialização Automatizada:** Script de estruturação de banco de dados (`init-db`) para criação de tabelas e sementes iniciais.

## Requisitos de Design (UI/UX)

### Paleta de Cores
- **Base:** Grafite (#1A1A1D), Cinza Profundo (#2A2A2F), Chumbo (#3C3C45).
- **Funcional:** Azul Elétrico (#2CC7FF), Verde (#2ECC71), Laranja (#FF7A29), Vermelho (#FF3B30).

### Layout
- **Barra Superior:** Telemetria permanente (Saldo Total, Receitas, Despesas, Projetado, Livre).
- **Coluna Esquerda:** Navegação e KPIs rápidos.
- **Área Central:** Console principal com painéis de Saldo Projetado, Estado do Dinheiro e Velocidade.
- **Coluna Direita:** Compromissos, Metas e Alertas.
- **Dock Inferior:** Ações rápidas (Adicionar despesa/receita, etc).

## Tecnologias
- React 19
- TypeScript
- Tailwind CSS
- Node.js / Express (Backend)
- SQL (MySQL/MariaDB) via Knex.js
- Lucide React (Ícones)
- Motion (Animações)

## Arquitetura Modular (Freemium)

### Módulos Disponíveis
1. **Finanças Básicas (Core)**: Gratuito. Gestão de contas, receitas e despesas.
2. **Investimentos (Premium)**: Pago. Acompanhamento de carteira, dividendos e rentabilidade. (Período de teste disponível).
3. **Metas Avançadas (Premium)**: Pago. Planejamento de longo prazo e simulações.

### Regras de Negócio
- **Instalação On-Demand**: O usuário escolhe quais módulos deseja ver em seu cockpit.
- **Período de Degustação (Trial)**: Módulos premium podem ser ativados para teste por 7 ou 15 dias.
- **Transparência**: O status do módulo (Teste, Ativo, Expirado) deve estar visível no menu lateral.

## Arquitetura de Dados (SQL)

### Tabelas Principais
1. **users**: id, name, email, password_hash, created_at.
2. **modules**: id, slug, name, description, price, trial_days.
3. **user_modules**: id, user_id, module_id, status (trial, active, expired), trial_ends_at, activated_at.
4. **accounts**: id, user_id, name, type, balance, color, created_at.
3. **transactions**: id, user_id, account_id, type (income, expense, transfer), category, amount, date, status (pending, confirmed), description, created_at.
4. **goals**: id, user_id, name, target_amount, current_amount, deadline, created_at.
