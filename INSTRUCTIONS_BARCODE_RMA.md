# Novas Funcionalidades: Código de Barras e Devoluções

Foram adicionadas duas grandes funcionalidades ao Gestor de Inventário para agilizar as vendas e o serviço pós-venda.

## 1. Leitor de Código de Barras (Scanner) 📷

Agora pode usar um leitor de código de barras USB (ou introduzir manualmente) para adicionar produtos à venda instantaneamente.

### Como Funciona:
1.  **Configurar Produtos:**
    - Vá à lista de produtos e edite um produto.
    - No novo campo **"Código de Barras (EAN)"**, insira o código do produto (pode usar o leitor para preencher este campo).
    - Guarde o produto.

2.  **Vender com Scanner:**
    - Vá ao menu **"Nova Venda"**.
    - Não precisa de clicar em nenhum campo. Basta apontar o leitor para o produto e ler o código.
    - O produto será adicionado automaticamente ao carrinho.
    - Se ler o mesmo código novamente, a quantidade aumenta.

> **Nota:** Se não tiver um leitor, o sistema funciona na mesma se digitar o código rapidamente no teclado e pressionar Enter.

---

## 2. Gestão de Devoluções (RMA) ↩️

Agora é possível processar devoluções de forma organizada e recuperando o stock automaticamente.

### Como Fazer uma Devolução:
1.  Vá ao menu **"Nova Venda"** e clique na aba **"Histórico"**.
2.  Encontre a venda original na lista.
3.  Clique no botão **"Devolver"** (ícone de seta laranja).
4.  Abre-se uma janela com os itens dessa venda.
5.  Indique a **quantidade a devolver** de cada item.
6.  Clique em **"Confirmar Devolução"**.

### O que o sistema faz:
- Cria uma nova transação de "Devolução" (valor negativo) para acertar o caixa.
- **Aumenta automaticamente o stock** dos produtos devolvidos.
- A devolução fica registada no histórico associada à venda original.

---

## Próximos Passos (Autenticação)

Para completar a segurança do sistema, recomendamos configurar a Autenticação Nativa do Supabase. Consulte o ficheiro `IMPROVEMENTS.md` para mais detalhes.
