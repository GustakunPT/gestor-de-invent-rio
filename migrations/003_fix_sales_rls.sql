-- ============================================
-- FIX: COLUNAS COM TAMANHO INSUFICIENTE
-- ============================================

-- 1. REMOVER VIEWS dependentes
DROP VIEW IF EXISTS v_top_customers CASCADE;
DROP VIEW IF EXISTS v_sales_monthly CASCADE;
DROP VIEW IF EXISTS v_sales_daily CASCADE;
DROP VIEW IF EXISTS v_sales_summary CASCADE;
DROP VIEW IF EXISTS v_product_sales CASCADE;

-- 2. Alterar colunas SALES (apenas as que são VARCHAR curto)
ALTER TABLE sales ALTER COLUMN id TYPE VARCHAR(50);
ALTER TABLE sales ALTER COLUMN customer_name TYPE VARCHAR(255);
ALTER TABLE sales ALTER COLUMN customer_nif TYPE VARCHAR(50);
ALTER TABLE sales ALTER COLUMN payment_method TYPE VARCHAR(50);

-- 3. Alterar colunas SALE_ITEMS (NÃO tocar product_id pois é UUID FK)
ALTER TABLE sale_items ALTER COLUMN sale_id TYPE VARCHAR(50);
ALTER TABLE sale_items ALTER COLUMN product_name TYPE VARCHAR(255);

-- 4. RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo a autenticados (sales)" ON sales;
CREATE POLICY "Permitir tudo a autenticados (sales)"
ON sales FOR ALL TO authenticated
USING (true) WITH CHECK (true);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo a autenticados (sale_items)" ON sale_items;
CREATE POLICY "Permitir tudo a autenticados (sale_items)"
ON sale_items FOR ALL TO authenticated
USING (true) WITH CHECK (true);

