-- ============================================
-- FIX: COLUNA PAYMENT_METHOD NA TABELA SALES
-- ============================================
-- Se a coluna não existir, adiciona-a

-- 1. Adicionar coluna payment_method (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'CASH';
    END IF;
END $$;

-- 2. Garantir que RLS permite inserção por utilizadores autenticados
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo a autenticados (sales)" ON sales;

CREATE POLICY "Permitir tudo a autenticados (sales)"
ON sales
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Mesmo para sale_items
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo a autenticados (sale_items)" ON sale_items;

CREATE POLICY "Permitir tudo a autenticados (sale_items)"
ON sale_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
