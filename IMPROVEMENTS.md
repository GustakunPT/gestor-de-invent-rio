# Melhorias e Potencial do Gestor de Inventário

Este documento descreve melhorias técnicas possíveis, novas funcionalidades sugeridas e os problemas de negócio que este software resolve atualmente.

## 🚀 Melhorias Imediatas (Status)

### 1. Autenticação Segura (Backend) - ✅ IMPLEMENTADO
**Funcionalidade:** Autenticação nativa com Supabase Auth (Email/Password).
**Como usar:** Consulte `SUPABASE_SETUP_GUIDE.md` para criar utilizadores e definir permissões.
**Segurança:** Sessões persistentes, validação de token e proteção de rotas.

### 2. Digitalização de Códigos de Barras - ✅ IMPLEMENTADO
**Funcionalidade:** O POS (`SalesManager.tsx`) agora suporta leitura direta de códigos de barras (EAN-13) via leitores USB ou teclado.
**Como usar:** Basta ler o código com o scanner enquanto estiver na tela de Nova Venda. Configure os códigos no formulário de edição de produtos.

### 3. Alertas de Stock por Email - ⏳ PENDENTE
**Sugestão:** Integração com um serviço de email (ex: Resend ou SendGrid) para avisar o gerente quando o stock de um produto crítico baixar do mínimo.
**Nota:** Requer configuração de Edge Functions ou API externa.

### 4. Gestão de Devoluções (RMA) - ✅ IMPLEMENTADO
**Funcionalidade:** Adicionado fluxo de devolução na aba "Histórico".
**Como usar:**
- No Histórico de Vendas, clique no botão "Devolver" (seta laranja).
- Selecione os itens e quantidades a retornar ao stock.
- O sistema gera uma nota de crédito e repõe o stock automaticamente.

---

## 💼 Problemas de Negócio que o Software Resolve

### 1. Fim da "Desorganização do Caderno"
Centralização de dados. Se o computador avariar, os dados (se sincronizados com a cloud/Supabase) estão seguros. A pesquisa é instantânea.

### 2. Prevenção de "Stock Morto" e "Ruptura"
- **Dashboard**: Mostra os produtos mais vendidos.
- **Alertas**: Avisa o que está a acabar.
- **Validade**: Evita desperdício de produtos perecíveis.

### 3. Conhecimento do Cliente (CRM Básico)
O módulo de Clientes (`CustomerManager`) permite ver:
- Histórico de compras de cada pessoa.
- Quem são os melhores clientes.

### 4. Controlo de Caixa e Lucro Real
O sistema calcula o **Lucro Estimado** (Preço Venda - Preço Custo) em tempo real, descontando promoções.

---

## 🛠️ Guia para Ajustes Manuais no Código

- **authService.ts**: Lógica de login/logout com Supabase.
- **components/LoginScreen.tsx**: Ecrã de login atualizado.
- **SalesManager.tsx**: Lógica do carrinho, scanner e devoluções.
