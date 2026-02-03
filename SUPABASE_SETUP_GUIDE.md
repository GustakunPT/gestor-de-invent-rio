# Guia de Configuração: Autenticação Segura (Supabase)

Para activar o novo sistema de login seguro, siga estes passos no Dashboard do Supabase.

## 1. Ativar Autenticação por Email

1.  Aceda ao seu projeto em [app.supabase.com](https://app.supabase.com).
2.  No menu lateral, clique em **Authentication**.
3.  Vá a **Providers**.
4.  Certifique-se que **Email** está **Enabled**.
5.  Desative "Confirm email" se quiser que o login funcione imediatamente sem validação de email (apenas para testes). Caso contrário, terá de confirmar o email real.

## 2. Criar Utilizadores e Definir Permissões

Como o registo público foi desativado por segurança, deve criar as contas manualmente:

1.  Em **Authentication**, vá a **Users**.
2.  Clique em **Add User**.
3.  Insira o Email e Password do funcionário.
4.  Crie o utilizador.

### Definir Admin vs Staff (Roles)

Por defeito, todos os utilizadores terão acesso de nível **STAFF** (Vendas e Clientes).
Para dar acesso de **ADMIN** (Configurações, Utilizadores, Fornecedores):

**Opção A (Simples - Via SQL):**
Execute este comando no SQL Editor do Supabase para tornar um email administrador:

```sql
UPDATE auth.users 
SET raw_user_meta_data = '{"role": "ADMIN", "name": "Nome do Admin"}'
WHERE email = 'admin@exemplo.com';
```

**Opção B (Via Interface - Futuro):**
Poderá implementar uma função para editar estas permissões na app, mas requer configuração avançada de Database Functions.

## 3. Segurança Crítica (Row Level Security) 🛡️

**O que é isto?**
A "Row Level Security" (RLS) funciona como um porteiro para a sua base de dados.
Sem RLS, qualquer pessoa na internet que descubra as suas chaves de API poderia ver ou apagar os seus dados.
Com RLS ativado, o Supabase bloqueia tudo por defeito e só deixa entrar quem tiver um "crachá" válido (estiver autenticado).

**Como aplicar (Copie e Cole este Script):**

1.  No painel do Supabase, clique no ícone **SQL Editor** [_>_] na barra lateral esquerda.
2.  Clique em **New Query**.
3.  Copie o código abaixo na íntegra.
4.  Clique no botão verde **RUN**.

```sql
-- --- PARTE 1: ATIVAR A SEGURANÇA (O Porteiro) ---
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- --- PARTE 2: CRIAR PERMISSÕES BÁSICAS (Staff) ---
-- Estas regras permitem acesso a TODOS os funcionários autenticados

-- Produtos, Clientes e Vendas: Todos podem ver e editar
CREATE POLICY "Staff acesso total: produtos" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff acesso total: customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff acesso total: sales" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff acesso total: history" ON history FOR ALL TO authenticated USING (true);

-- --- PARTE 3: PERMISSÕES AVANÇADAS (Só Admin) ---
-- Se quiser restringir certas tabelas APENAS a admins, USE ESTAS COMANDOS EM VEZ DOS ACIMA para essas tabelas:

-- Exemplo: Apenas Admin pode ver/editar a tabela de Utilizadores
CREATE POLICY "Apenas Admin gere users" ON app_users
FOR ALL TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- Exemplo: Apenas Admin pode ver Fornecedores
CREATE POLICY "Apenas Admin gere fornecedores" ON suppliers
FOR ALL TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);
```

**Resultado:**
Após executar este script, a sua aplicação estará segura. O staff poderá vender, mas se tentarem aceder à tabela de utilizadores (users) via API, serão bloqueados se não tiverem a role 'ADMIN'.
