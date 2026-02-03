-- ============================================
-- FIX: PERMISSÕES DA TABELA DE COMPRAS (RLS)
-- ============================================

-- 1. Garante que RLS está ativo (boa prática)
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 2. Cria política para permitir tudo a utilizadores autenticados
-- A tabela purchase_orders estava a bloquear a escrita ("new row violates...")
-- Esta política permite SELECT, INSERT, UPDATE, DELETE a quem tiver login feito.

DROP POLICY IF EXISTS "Permitir tudo a autenticados (compras)" ON purchase_orders;

CREATE POLICY "Permitir tudo a autenticados (compras)"
ON purchase_orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Mesma coisa para os itens da encomenda
DROP POLICY IF EXISTS "Permitir tudo a autenticados (itens)" ON purchase_order_items;

CREATE POLICY "Permitir tudo a autenticados (itens)"
ON purchase_order_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Opcional: Se quiser adicionar user_id para auditoria futura
-- ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
