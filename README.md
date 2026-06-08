# Next-Hamburgueria (Monorepo Fullstack)

Este projeto é a migração do sistema **Paraíba Lanches** (anteriormente separado em Go para backend e React/Vite para frontend) para uma arquitetura moderna e unificada usando **Next.js 15 (App Router)** e **Prisma ORM**.

## 🛠️ Tecnologias
- **Framework**: Next.js 15 (React 19)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Banco de Dados**: PostgreSQL (via Docker)
- **ORM**: Prisma ORM

---

## 📋 Lista de Tarefas (Progresso da Migração)

Aqui está a lista do que já fizemos e o que falta para terminarmos a migração completa:

- [x] **1. Inicialização e Infraestrutura**
  - [x] Criar projeto base do Next.js
  - [x] Configurar Docker (`docker-compose.yml`, `Dockerfile`, `.dockerignore`)
- [x] **2. Banco de Dados (Prisma)**
  - [x] Instalar Prisma
  - [x] Mapear modelos antigos do Go (User, Product, Order, etc.) para `schema.prisma`
  - [x] Criar primeira migration (`init`)
- [x] **3. Migração do Backend (API Routes)**
  - [x] Rota de Autenticação (Login/Me) e Middleware JWT
  - [x] Rota de Categorias e Produtos (`/api/products`, `/api/categories`)
  - [x] Rota de Pedidos (`/api/orders`)
  - [x] Rota de Clientes (`/api/clients`)
  - [x] Lógicas de cálculo de frete (Google Maps) e validação complexa de Pedidos
  - [x] Rotas de Fechamento de Caixa (`/api/closures`)
  - [x] Rotas de Configuração (`/api/settings`) e Relatórios (`/api/reports`)
  - [x] Rotas de Cupons (`/api/coupons`) e Promoções/Vitrine (`/api/merchandising`, `/api/promotions`)
- [x] **4. Migração do Frontend (Pages & Components)**
  - [x] Copiar `tailwind.config`, `components.json` e utilitários
  - [x] Migrar componentes do shadcn/ui para a nova estrutura
  - [x] Migrar páginas principais (`/pdv`, `/dashboard`, `/menu`, etc.)
  - [x] Integrar chamadas frontend (Zustand/Axios/Fetch) para as novas rotas API internas do Next.js
- [x] **5. Aprimoramentos Finais e Correções (Em Andamento)**
  - [x] **Componentização**: Divisão de páginas gigantes (God Objects) como `/settings`, `/new-order` e `/coupons` em componentes menores (ex: `AddressAutocomplete`, `CartSidebar`, etc).
  - [x] **Otimização de Imagens**: Migração de tags `<img>` para `next/image` (`<Image>`) configurando o `remotePatterns`.
  - [x] **Hydration**: Uso seguro de `localStorage` via Zustand `persist` nas stores.
  - [x] **Limpeza de Tipagem**: Remoção de tipos genéricos `any` (`<any>`) nas rotas da API e substituição por interfaces TypeScript estritas.
  - [x] **Desafio de Tempo Real (Escalabilidade)**: Expandir o SSE (Server-Sent Events) atual que usa Event Emitter em memória para uma solução escalável baseada em Redis Pub/Sub, garantindo sincronização de novos pedidos no painel entre múltiplos containers Docker em produção.
  - [x] **Testes e Deploy**: Validar compatibilidade 100% no ambiente Docker, garantindo o build perfeito para produção e criar testes E2E do PDV com Playwright.

---

## 🚀 Próximos Passos e Novas Ideias (Roadmap)

O sistema central de PDV está pronto e migrado. Abaixo estão as frentes de evolução que planejamos desenvolver para tornar o sistema um PDV e Gestor ultra-robusto:

- [ ] **1. Módulo Financeiro e "Fechamento de Caixa" Cego**: Criar um fluxo rigoroso onde o operador precisa declarar os valores físicos contados no caixa antes de ver o total esperado pelo sistema, facilitando a identificação de "quebras" de caixa pelo proprietário.
- [ ] **2. Integração de Pagamentos Reais (Pix/Cartão)**: Integração com APIs como Mercado Pago ou Stripe para gerar QR Codes dinâmicos em tempo real na tela, alterando o status do pedido para "Pago" de forma totalmente automatizada.
- [ ] **3. Painel de Logística (Gestão de Entregadores)**: Módulo de expedição onde o gerente atribui pedidos prontos a motoboys específicos, garantindo controle de tempo de entrega e geração de relatórios de repasse financeiro (fretes) no fim da noite.
- [ ] **4. KDS (Kitchen Display System - Tela da Cozinha)**: Rota dedicada para tablets ou TVs na cozinha. Pedidos caem na tela em tempo real (via Redis), substituindo a impressão em papel. O cozinheiro marca como "Pronto" e avisa o PDV instantaneamente.
- [ ] **5. Emissão de Notas Fiscais (NFC-e / SAT)**: Integração com serviços de emissão fiscal para gerar cupons eletrônicos no ato do fechamento do pedido de acordo com as leis estaduais.

---

## 🚀 Como Rodar o Projeto (Docker)

O projeto está configurado para subir em um único comando usando Docker Compose, contendo a aplicação Next.js (Frontend e Backend) e o PostgreSQL.

**Passo 1: Subir os containers**
Na pasta `next-hamburgueria`, execute:
```bash
docker compose -f docker/docker-compose.yml up --build
```

Isso fará o seguinte automaticamente:
1. Compilar o banco de dados PostgreSQL.
2. Fazer o *build* de produção do Next.js.
3. Rodar as migrações do Prisma (`npx prisma migrate deploy`).
4. Executar o script de *seed* criando o usuário Admin padrão (`admin@admin.com` / `admin123`).
5. Subir a aplicação na porta 3000.

**Passo 2: Acessar**
Acesse [http://localhost:3000](http://localhost:3000).

---

## 🛠 Como Rodar o Projeto (Localmente - Dev Mode)

Caso queira rodar o Next.js localmente para desenvolvimento:

1. Suba apenas o banco de dados (e o Redis) se preferir usar o Docker:
```bash
docker compose -f docker/docker-compose.yml up -d postgres redis
```
2. Instale as dependências:
```bash
npm install
```
3. Crie o arquivo `.env` baseado nas variáveis do docker (exemplo):
```env
DATABASE_URL="postgresql://caixa:caixapass@localhost:5432/caixa_db?schema=public"
JWT_SECRET="caixa_super_secret_key_123"
REDIS_URL="redis://localhost:6379"
```
4. Rode as migrações e seed:
```bash
npx prisma migrate dev
npx prisma db seed
```
5. Inicie o servidor:
```bash
npm run dev
```
