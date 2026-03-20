# GLICK - Sistema de Gestão Financeira Pessoal Avançado

## Visão Geral
O GLICK é um console de decisão financeira diária projetado para oferecer controle total, clareza de dados e previsibilidade de saldo. A interface é inspirada em cockpits técnicos, priorizando a densidade de informações e o monitoramento constante.

## Requisitos Funcionais

### 1. Gestão de Contas e Cartões
- Suporte a múltiplos tipos de conta (Corrente, Digital, Carteira, Investimento).
- Gestão de cartões de crédito com controle de limite e datas de fechamento/vencimento.
- Transferências entre contas.

### 2. Controle de Transações
- Registro de Receitas, Despesas e Transferências no Centro de Fluxo de Caixa.
- Categorização hierárquica (Categoria -> Subcategoria).
- Status de transação: pendente, confirmado, reconciliado.
- Despesas recorrentes (mensal, semanal, anual).
- Filtros avançados por tipo (Entradas, Saídas, Transferências) e categoria.

### 3. Inteligência e Previsão
- **Saldo Projetado:** Cálculo automático do saldo final do mês baseado em receitas e despesas futuras.
- **Estado do Dinheiro:** Classificação em Comprometido, Reservado e Livre.
- **Velocidade do Dinheiro:** Cálculo de gasto médio diário e autonomia financeira (dias restantes).

### 4. Metas e Alertas
- Definição de metas financeiras com acompanhamento de progresso.
- Sistema de alertas para vencimentos, saldo baixo e gastos elevados.

### 5. Usabilidade
- **Tooltips Informativos:** Explicações detalhadas para cada KPI na barra superior e barra lateral ao passar o mouse.
- **Responsividade Total:** Interface adaptável para dispositivos móveis, tablets e desktops, com menus laterais retráteis em ambos os lados e empilhamento inteligente de painéis.
- **Visualização de Dados:** Gráficos interativos de fluxo de gastos utilizando Recharts.
- **SEO Profissional:** Estrutura semântica HTML5, meta tags otimizadas e dados estruturados JSON-LD.
- **Sistema de Modais:** Interface de entrada rápida para receitas, despesas, contas, metas, cartões e categorias com validação visual e feedback via toasts.
- **Lista de Transações:** Visualização detalhada das movimentações recentes com filtros rápidos.
- **Configurações do Usuário:** Console dedicado para gestão de perfil, segurança, preferências de sistema e exportação de dados.
- **Refinamento de Usabilidade:** Tooltips corrigidos para evitar clipping, contraste de cores aprimorado para legibilidade técnica e targets de interação otimizados.
- **Controle de Layout:** Botões dedicados na barra superior para ocultar/mostrar as barras laterais esquerda e direita, permitindo foco total nos dados centrais.
- **Header Inteligente:** Telemetria responsiva que oculta rótulos de texto em telas menores para evitar sobreposição e garantir clareza visual.
- **Console Modular:** Implementação completa das visões de Movimentações, Contas, Cartões, Metas, Categorias e Relatórios Inteligentes.
- **Marketplace de Módulos:** Sistema de descoberta e ativação de extensões premium (Investimentos, etc).
- **Estabilidade Técnica:** Implementação de Error Boundaries e tratamento de falhas de API para garantir resiliência do sistema.
- **Integração Full-Stack:** Backend Express configurado com Knex.js para persistência em banco de dados SQL, permitindo sincronização real de transações, contas, cartões e metas.
- **Persistência de Dados:** Implementação de rotas de API para CRUD de transações, gestão de contas, cartões, metas e catálogo de módulos.
- **Telemetria Avançada:** Cálculo dinâmico de Gasto Médio Diário e Autonomia Financeira baseado no histórico real de transações dos últimos 30 dias.
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

## Arquitetura Lógica — GLICK (Visão Macro)

O sistema é dividido em 3 camadas principais para garantir integridade e escalabilidade:

### 1. Camadas do Sistema
- **INTERFACE (UI):** Dashboard, telas de gestão e inputs de dados.
- **CORE FINANCE ENGINE:** O "Cérebro" do sistema. Gere saldos, projeções, estados do dinheiro e validações.
- **MODULE MANAGER:** Controla o registro, ativação e acesso (Free/Paid) às funcionalidades.
- **STORAGE / DATABASE:** Persistência em SQL (MySQL/SQLite).

### 2. Princípio Estrutural (Crítico)
Todos os módulos **NÃO** controlam dinheiro diretamente. Toda movimentação financeira deve passar obrigatoriamente pelo **CORE FINANCE ENGINE**. Isso evita inconsistências de saldo entre diferentes funcionalidades (ex: Cripto vs. Contas Correntes).

### 3. Detalhamento das Camadas

#### CORE FINANCE ENGINE
- **Estados do Dinheiro:**
    - **Total:** Saldo bruto em todas as contas.
    - **Comprometido:** Faturas abertas + Lançamentos pendentes.
    - **Reservado:** Dinheiro alocado em metas/objetivos.
    - **Livre:** Capital disponível para uso imediato.
- **Telemetria:**
    - **Gasto Médio Diário (GMD):** Velocidade de evasão de capital.
    - **Autonomia Financeira:** Dias de sobrevivência baseados no GMD.
- **Motor de Projeção (Forecast):** Snapshots de saldo futuro baseados em recorrências e pendências.

#### MODULE MANAGER
- Gerencia o ciclo de vida dos módulos (Instalação, Ativação, Trial).
- Controla o acesso a funcionalidades Premium (Cripto, Investimentos Avançados).

#### MÓDULOS (Funcionalidades)
- **Módulo 1 (Finance - Free):** Gestão essencial de contas, transações, categorias e metas.
- **Módulo 2 (Crypto - Paid):** Gestão de ativos digitais, operações de compra/venda e cálculo de Profit/Loss.
- **Módulo 3 (Investments - Paid):** Renda fixa, ações, fundos e acompanhamento de rendimentos.

### 4. Fluxo de Dados (Event-Driven)
1. Um **Módulo** (ex: Investimentos) registra um rendimento.
2. O módulo envia um **Evento** para o **CORE FINANCE ENGINE**.
3. O **CORE** valida o evento e atualiza o **Saldo Global**.
4. A **UI** reflete a mudança instantaneamente através de WebSockets ou re-fetch.

## Arquitetura de Dados (SQL)

### Tabelas Principais
1. **users**: id, name, email, password_hash, created_at.
2. **modules**: id, slug, name, description, price, trial_days.
3. **user_modules**: id, user_id, module_id, status (trial, active, expired, inactive), trial_ends_at, activated_at.
4. **accounts**: id, user_id, name, type, balance, color, created_at.
3. **transactions**: id, user_id, account_id, type (income, expense, transfer), category, amount, date, status (pending, confirmed), description, created_at.
4. **goals**: id, user_id, name, target_amount, current_amount, deadline, created_at.

## Guia de Migração (MySQL/Hostinger)

Para mover o projeto para o seu servidor Hostinger, siga estes passos:

1. **Configuração do Banco de Dados:**
   - Crie um banco de dados MySQL no painel da Hostinger.
   - Anote o Host (geralmente `localhost`), Nome do Banco, Usuário e Senha.

2. **Variáveis de Ambiente:**
   - No seu ambiente de deploy (ou arquivo `.env`), configure:
     ```env
     DB_HOST=seu_host_hostinger
     DB_USER=seu_usuario
     DB_PASS=sua_senha
     DB_NAME=seu_banco
     JWT_SECRET=sua_chave_secreta
     ```

3. **Inicialização das Tabelas:**
   - O projeto possui um script automatizado que cria todas as tabelas e sementes iniciais.
   - Execute o comando: `npm run init-db`
   - Este comando lerá as configurações do seu `.env` e estruturará o banco MySQL automaticamente.

4. **SSL (Segurança):**
   - Em ambientes de produção, o sistema está configurado para usar SSL (`rejectUnauthorized: false`) para garantir a criptografia dos dados em trânsito.

5. **Modo de Preview (Sandbox):**
   - Para facilitar testes locais ou em ambientes de preview sem MySQL, o sistema utiliza automaticamente **SQLite** (`data.sqlite`) se as variáveis `DB_HOST` não forem detectadas.
