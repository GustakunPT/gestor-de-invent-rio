-- ============================================
-- DADOS DE TESTE - GESTOR DE INVENTÁRIO
-- ============================================
-- Execute DEPOIS do script de criação de tabelas

-- ============================================
-- 1. FORNECEDORES
-- ============================================

INSERT INTO suppliers (id, name, email, phone, address, nif, website, contact_person, payment_terms) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TechDistribuidores Lda', 'vendas@techdist.pt', '+351 210 123 456', 'Rua da Tecnologia 100, 1000-100 Lisboa', '501234567', 'www.techdist.pt', 'João Silva', '30 dias'),
  ('22222222-2222-2222-2222-222222222222', 'Eletrónica Global SA', 'info@eletronicaglobal.pt', '+351 220 987 654', 'Av. da Indústria 500, 4000-200 Porto', '502345678', 'www.eletronicaglobal.pt', 'Maria Santos', '60 dias'),
  ('33333333-3333-3333-3333-333333333333', 'Acessórios Pro', 'contacto@acessoriospro.pt', '+351 231 456 789', 'Zona Industrial de Aveiro, 3800-100 Aveiro', '503456789', NULL, 'Pedro Costa', 'Pronto pagamento'),
  ('44444444-4444-4444-4444-444444444444', 'ImportExport Tech', 'geral@importexport.pt', '+351 212 345 678', 'Parque Empresarial, 2700-100 Amadora', '504567890', 'www.importexport.pt', 'Ana Ferreira', '45 dias'),
  ('55555555-5555-5555-5555-555555555555', 'ComponentesMaster', 'encomendas@componentesmaster.pt', '+351 253 111 222', 'Rua dos Componentes 25, 4700-100 Braga', '505678901', NULL, 'Carlos Oliveira', '30 dias');

-- ============================================
-- 2. PRODUTOS
-- ============================================

INSERT INTO products (id, sku, name, category, quantity, min_stock, max_stock, location, price, cost_price, supplier_id, barcode, tax_rate, expiration_date, weight) VALUES
  -- Smartphones
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'IPHONE15-128', 'iPhone 15 128GB', 'Smartphones', 25, 5, 50, 'A1-01', 999.99, 750.00, '11111111-1111-1111-1111-111111111111', '5901234123457', 23, NULL, 0.171),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'IPHONE15-256', 'iPhone 15 256GB', 'Smartphones', 15, 5, 30, 'A1-02', 1129.99, 850.00, '11111111-1111-1111-1111-111111111111', '5901234123458', 23, NULL, 0.171),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'SAMSUNG-S24', 'Samsung Galaxy S24', 'Smartphones', 30, 5, 50, 'A1-03', 899.99, 680.00, '22222222-2222-2222-2222-222222222222', '5901234123459', 23, NULL, 0.168),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'XIAOMI-14', 'Xiaomi 14', 'Smartphones', 40, 10, 60, 'A1-04', 699.99, 520.00, '22222222-2222-2222-2222-222222222222', '5901234123460', 23, NULL, 0.193),
  
  -- Portáteis
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MACBOOK-AIR-M3', 'MacBook Air M3 256GB', 'Portáteis', 12, 3, 20, 'B1-01', 1399.00, 1100.00, '11111111-1111-1111-1111-111111111111', '5901234123461', 23, NULL, 1.24),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'LENOVO-THINKPAD', 'Lenovo ThinkPad X1 Carbon', 'Portáteis', 8, 2, 15, 'B1-02', 1599.00, 1250.00, '22222222-2222-2222-2222-222222222222', '5901234123462', 23, NULL, 1.12),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'HP-PAVILION-15', 'HP Pavilion 15', 'Portáteis', 20, 5, 30, 'B1-03', 799.00, 600.00, '44444444-4444-4444-4444-444444444444', '5901234123463', 23, NULL, 1.75),
  
  -- Acessórios
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'AIRPODS-PRO-2', 'AirPods Pro 2', 'Acessórios', 50, 10, 80, 'C1-01', 279.00, 200.00, '11111111-1111-1111-1111-111111111111', '5901234123464', 23, NULL, 0.051),
  ('cccccccc-cccc-cccc-cccc-cccccccccccd', 'SAMSUNG-BUDS2', 'Samsung Galaxy Buds2 Pro', 'Acessórios', 35, 10, 60, 'C1-02', 199.00, 140.00, '22222222-2222-2222-2222-222222222222', '5901234123465', 23, NULL, 0.048),
  ('cccccccc-cccc-cccc-cccc-ccccccccccce', 'LOGITECH-MX3', 'Logitech MX Master 3S', 'Acessórios', 25, 5, 40, 'C1-03', 109.00, 75.00, '33333333-3333-3333-3333-333333333333', '5901234123466', 23, NULL, 0.141),
  ('cccccccc-cccc-cccc-cccc-cccccccccccf', 'APPLE-WATCH-9', 'Apple Watch Series 9', 'Acessórios', 18, 5, 25, 'C1-04', 449.00, 350.00, '11111111-1111-1111-1111-111111111111', '5901234123467', 23, NULL, 0.039),
  
  -- Cabos e Carregadores
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CABO-USB-C-2M', 'Cabo USB-C 2 metros', 'Cabos', 150, 30, 200, 'D1-01', 14.99, 5.00, '33333333-3333-3333-3333-333333333333', '5901234123468', 23, NULL, 0.035),
  ('dddddddd-dddd-dddd-dddd-ddddddddddde', 'CARREGADOR-65W', 'Carregador USB-C 65W', 'Cabos', 80, 20, 120, 'D1-02', 39.99, 18.00, '33333333-3333-3333-3333-333333333333', '5901234123469', 23, NULL, 0.120),
  ('dddddddd-dddd-dddd-dddd-dddddddddddf', 'POWERBANK-20K', 'Power Bank 20000mAh', 'Cabos', 45, 10, 70, 'D1-03', 49.99, 25.00, '44444444-4444-4444-4444-444444444444', '5901234123470', 23, NULL, 0.350),
  
  -- Produtos com stock baixo (para testar alertas)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'IPAD-PRO-11', 'iPad Pro 11" 256GB', 'Tablets', 2, 5, 20, 'E1-01', 1099.00, 850.00, '11111111-1111-1111-1111-111111111111', '5901234123471', 23, NULL, 0.466),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'MONITOR-4K-27', 'Monitor 4K 27"', 'Monitores', 0, 3, 15, 'E1-02', 499.00, 380.00, '44444444-4444-4444-4444-444444444444', '5901234123472', 23, NULL, 5.200),
  
  -- Produto com validade próxima
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'BATERIA-IPHONE', 'Bateria Substituição iPhone', 'Peças', 100, 20, 150, 'F1-01', 29.99, 12.00, '55555555-5555-5555-5555-555555555555', '5901234123473', 23, '2026-03-15', 0.025);

-- ============================================
-- 3. CLIENTES
-- ============================================

INSERT INTO customers (id, name, nif, email, phone, address, postal_code, type, credit_limit, loyalty_points, discount_percentage) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'TechSolutions Lda', '509876543', 'compras@techsolutions.pt', '+351 210 111 222', 'Rua das Empresas 50, Lisboa', '1100-100', 'COMPANY', 5000.00, 2500, 5.00),
  ('c2222222-2222-2222-2222-222222222222', 'InfoWorld SA', '508765432', 'procurement@infoworld.pt', '+351 220 333 444', 'Av. dos Negócios 200, Porto', '4000-200', 'COMPANY', 10000.00, 8500, 10.00),
  ('c3333333-3333-3333-3333-333333333333', 'António Silva', '123456789', 'antonio.silva@email.com', '+351 912 345 678', 'Rua Particular 15, Coimbra', '3000-100', 'INDIVIDUAL', 0.00, 750, 0.00),
  ('c4444444-4444-4444-4444-444444444444', 'Maria Fernandes', '234567891', 'maria.fernandes@gmail.com', '+351 923 456 789', 'Av. da Liberdade 100, Faro', '8000-100', 'INDIVIDUAL', 0.00, 320, 0.00),
  ('c5555555-5555-5555-5555-555555555555', 'Pedro Costa', '345678912', 'pedro.costa@outlook.pt', '+351 934 567 890', 'Rua Nova 25, Braga', '4700-100', 'INDIVIDUAL', 500.00, 1200, 2.50),
  ('c6666666-6666-6666-6666-666666666666', 'Ana Rodrigues', '456789123', 'ana.rodrigues@email.pt', '+351 965 432 109', 'Praça Central 8, Setúbal', '2900-100', 'INDIVIDUAL', 0.00, 50, 0.00),
  ('c7777777-7777-7777-7777-777777777777', 'StartupTech Unipessoal', '507654321', 'geral@startuptech.pt', '+351 211 987 654', 'Hub Tecnológico, Lisboa', '1200-100', 'COMPANY', 2500.00, 3200, 7.50);

-- ============================================
-- 4. UTILIZADORES
-- ============================================

-- Admin já foi criado no script de tabelas (id=1, pass=1234)
INSERT INTO app_users (id, name, password, role, email, phone) VALUES
  ('2', 'Carlos Vendedor', '1234', 'STAFF', 'carlos@empresa.pt', '+351 911 111 111'),
  ('3', 'Sofia Gestora', '1234', 'ADMIN', 'sofia@empresa.pt', '+351 922 222 222'),
  ('4', 'Miguel Staff', '1234', 'STAFF', 'miguel@empresa.pt', '+351 933 333 333')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. VENDAS (últimos 30 dias)
-- ============================================

INSERT INTO sales (id, customer_id, customer_name, customer_nif, date, total_amount, user_id, payment_method, payment_status, status, subtotal, discount_amount, profit) VALUES
  ('INV-2026-001', 'c1111111-1111-1111-1111-111111111111', 'TechSolutions Lda', '509876543', NOW() - INTERVAL '25 days', 3149.97, '2', 'TRANSFER', 'PAID', 'COMPLETED', 3149.97, 0, 749.97),
  ('INV-2026-002', 'c3333333-3333-3333-3333-333333333333', 'António Silva', '123456789', NOW() - INTERVAL '22 days', 1278.99, '2', 'CARD', 'PAID', 'COMPLETED', 1278.99, 0, 328.99),
  ('INV-2026-003', 'c2222222-2222-2222-2222-222222222222', 'InfoWorld SA', '508765432', NOW() - INTERVAL '20 days', 4796.00, '3', 'TRANSFER', 'PAID', 'COMPLETED', 5296.00, 500.00, 1196.00),
  ('INV-2026-004', 'c4444444-4444-4444-4444-444444444444', 'Maria Fernandes', '234567891', NOW() - INTERVAL '18 days', 279.00, '4', 'MBWAY', 'PAID', 'COMPLETED', 279.00, 0, 79.00),
  ('INV-2026-005', NULL, 'Consumidor Final', '000000000', NOW() - INTERVAL '15 days', 64.98, '2', 'CASH', 'PAID', 'COMPLETED', 64.98, 0, 24.98),
  ('INV-2026-006', 'c5555555-5555-5555-5555-555555555555', 'Pedro Costa', '345678912', NOW() - INTERVAL '12 days', 1448.99, '3', 'CARD', 'PAID', 'COMPLETED', 1508.99, 60.00, 398.99),
  ('INV-2026-007', 'c7777777-7777-7777-7777-777777777777', 'StartupTech Unipessoal', '507654321', NOW() - INTERVAL '10 days', 2697.00, '2', 'TRANSFER', 'PENDING', 'COMPLETED', 2897.00, 200.00, 697.00),
  ('INV-2026-008', 'c6666666-6666-6666-6666-666666666666', 'Ana Rodrigues', '456789123', NOW() - INTERVAL '7 days', 699.99, '4', 'CARD', 'PAID', 'COMPLETED', 699.99, 0, 179.99),
  ('INV-2026-009', NULL, 'Consumidor Final', '000000000', NOW() - INTERVAL '5 days', 148.99, '2', 'CASH', 'PAID', 'COMPLETED', 148.99, 0, 48.99),
  ('INV-2026-010', 'c1111111-1111-1111-1111-111111111111', 'TechSolutions Lda', '509876543', NOW() - INTERVAL '2 days', 2198.00, '3', 'TRANSFER', 'PAID', 'COMPLETED', 2198.00, 0, 548.00),
  ('INV-2026-011', 'c3333333-3333-3333-3333-333333333333', 'António Silva', '123456789', NOW() - INTERVAL '1 day', 449.00, '2', 'MBWAY', 'PAID', 'COMPLETED', 449.00, 0, 99.00);

-- ============================================
-- 6. ITENS DAS VENDAS
-- ============================================

INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, cost_price, total) VALUES
  -- INV-2026-001: 3x iPhone 15 128GB
  ('INV-2026-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iPhone 15 128GB', 3, 999.99, 750.00, 2999.97),
  ('INV-2026-001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cabo USB-C 2 metros', 10, 14.99, 5.00, 149.90),
  
  -- INV-2026-002: 1x iPhone 15 128GB + AirPods
  ('INV-2026-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iPhone 15 128GB', 1, 999.99, 750.00, 999.99),
  ('INV-2026-002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'AirPods Pro 2', 1, 279.00, 200.00, 279.00),
  
  -- INV-2026-003: MacBooks para empresa
  ('INV-2026-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MacBook Air M3 256GB', 3, 1399.00, 1100.00, 4197.00),
  ('INV-2026-003', 'cccccccc-cccc-cccc-cccc-ccccccccccce', 'Logitech MX Master 3S', 3, 109.00, 75.00, 327.00),
  
  -- INV-2026-004: AirPods
  ('INV-2026-004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'AirPods Pro 2', 1, 279.00, 200.00, 279.00),
  
  -- INV-2026-005: Cabos
  ('INV-2026-005', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cabo USB-C 2 metros', 2, 14.99, 5.00, 29.98),
  ('INV-2026-005', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'Carregador USB-C 65W', 1, 39.99, 18.00, 39.99),
  
  -- INV-2026-006: Samsung + Acessórios
  ('INV-2026-006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'Samsung Galaxy S24', 1, 899.99, 680.00, 899.99),
  ('INV-2026-006', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'Samsung Galaxy Buds2 Pro', 1, 199.00, 140.00, 199.00),
  ('INV-2026-006', 'dddddddd-dddd-dddd-dddd-dddddddddddf', 'Power Bank 20000mAh', 2, 49.99, 25.00, 99.98),
  
  -- INV-2026-007: Portáteis
  ('INV-2026-007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'Lenovo ThinkPad X1 Carbon', 1, 1599.00, 1250.00, 1599.00),
  ('INV-2026-007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'HP Pavilion 15', 1, 799.00, 600.00, 799.00),
  
  -- INV-2026-008: Xiaomi
  ('INV-2026-008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'Xiaomi 14', 1, 699.99, 520.00, 699.99),
  
  -- INV-2026-009: Acessórios
  ('INV-2026-009', 'cccccccc-cccc-cccc-cccc-ccccccccccce', 'Logitech MX Master 3S', 1, 109.00, 75.00, 109.00),
  ('INV-2026-009', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'Carregador USB-C 65W', 1, 39.99, 18.00, 39.99),
  
  -- INV-2026-010: iPhone bulk
  ('INV-2026-010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'iPhone 15 256GB', 2, 1099.00, 850.00, 2198.00),
  
  -- INV-2026-011: Apple Watch
  ('INV-2026-011', 'cccccccc-cccc-cccc-cccc-cccccccccccf', 'Apple Watch Series 9', 1, 449.00, 350.00, 449.00);

-- ============================================
-- 7. ENCOMENDAS A FORNECEDORES
-- ============================================

INSERT INTO purchase_orders (id, supplier_id, date, status, total, notes) VALUES
  ('PO-2026-001', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days', 'RECEBIDO', 15000.00, 'Encomenda mensal iPhones'),
  ('PO-2026-002', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 days', 'RECEBIDO', 8500.00, 'Samsung Galaxy S24'),
  ('PO-2026-003', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '10 days', 'RECEBIDO', 2500.00, 'Cabos e carregadores'),
  ('PO-2026-004', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '3 days', 'PENDENTE', 12000.00, 'Monitores e portáteis'),
  ('PO-2026-005', '11111111-1111-1111-1111-111111111111', NOW(), 'PENDENTE', 22000.00, 'Reposição stock Apple');

-- ============================================
-- 8. ITENS DAS ENCOMENDAS
-- ============================================

INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, quantity, cost) VALUES
  ('PO-2026-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iPhone 15 128GB', 20, 750.00),
  ('PO-2026-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'Samsung Galaxy S24', 10, 680.00),
  ('PO-2026-002', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'Samsung Galaxy Buds2 Pro', 25, 140.00),
  ('PO-2026-003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cabo USB-C 2 metros', 200, 5.00),
  ('PO-2026-003', 'dddddddd-dddd-dddd-dddd-ddddddddddde', 'Carregador USB-C 65W', 50, 18.00),
  ('PO-2026-004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'Monitor 4K 27"', 20, 380.00),
  ('PO-2026-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'HP Pavilion 15', 10, 600.00),
  ('PO-2026-005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iPhone 15 128GB', 25, 750.00),
  ('PO-2026-005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MacBook Air M3 256GB', 5, 1100.00);

-- ============================================
-- 9. PROMOÇÕES
-- ============================================

INSERT INTO promotions (name, type, value, start_date, end_date, coupon_code, min_purchase, max_uses, is_active) VALUES
  ('Desconto Verão 2026', 'PERCENTAGE', 10.00, '2026-06-01', '2026-08-31', 'VERAO10', 50.00, 500, true),
  ('Black Friday', 'PERCENTAGE', 20.00, '2026-11-25', '2026-11-30', 'BLACK20', 100.00, 1000, true),
  ('Novo Cliente', 'FIXED', 15.00, '2026-01-01', '2026-12-31', 'BEMVINDO15', 75.00, NULL, true),
  ('Compras Empresa', 'PERCENTAGE', 8.00, '2026-01-01', '2026-12-31', 'EMPRESA8', 500.00, NULL, true),
  ('Flash Sale', 'PERCENTAGE', 25.00, '2026-02-01', '2026-02-07', 'FLASH25', 200.00, 100, false);

-- ============================================
-- 10. HISTÓRICO/AUDITORIA
-- ============================================

INSERT INTO history (id, user_id, user_name, product_id, product_name, action, details, timestamp) VALUES
  ('HIST-001', '1', 'Administrador', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iPhone 15 128GB', 'STOCK_ADJUSTMENT', 'Ajuste inicial: +25 unidades', NOW() - INTERVAL '30 days'),
  ('HIST-002', '2', 'Carlos Vendedor', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iPhone 15 128GB', 'SALE', 'Venda INV-2026-001: -3 unidades', NOW() - INTERVAL '25 days'),
  ('HIST-003', '3', 'Sofia Gestora', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MacBook Air M3 256GB', 'RECEBIMENTO', 'PO-2026-001 recebido: +10 unidades', NOW() - INTERVAL '20 days'),
  ('HIST-004', '1', 'Administrador', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'Monitor 4K 27"', 'STOCK_ALERT', 'Alerta: Stock esgotado', NOW() - INTERVAL '5 days'),
  ('HIST-005', '2', 'Carlos Vendedor', 'cccccccc-cccc-cccc-cccc-cccccccccccf', 'Apple Watch Series 9', 'SALE', 'Venda INV-2026-011: -1 unidade', NOW() - INTERVAL '1 day');

-- ============================================
-- FIM DOS DADOS DE TESTE
-- ============================================

-- RESUMO:
-- • 5 Fornecedores
-- • 17 Produtos (incluindo 2 com stock baixo para alertas)
-- • 7 Clientes (5 particulares, 2 empresas)
-- • 4 Utilizadores (2 admin, 2 staff)
-- • 11 Vendas com itens
-- • 5 Encomendas a fornecedores
-- • 5 Promoções (3 ativas, 2 inativas)
-- • 5 Entradas de histórico
