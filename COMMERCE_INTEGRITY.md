# Integridade comercial — Eletroshopp

## Preços e pedidos
- A tabela `public.produtos` é a fonte autoritativa dos preços e códigos de venda.
- A Edge Function `create-order` chama a função SQL `create_order_secure`, que resolve cada código do catálogo no banco e não aceita preços enviados pelo navegador como autoridade.
- Se o preço exibido estiver desatualizado, a API devolve `PRICE_CHANGED` e não grava o pedido.
- O subtotal é recalculado no banco; os itens gravados usam nome, preço, categoria e identificador do catálogo.

## Estoque
- `produtos.estoque_controlado` permite ativar controle real por produto.
- Todos os produtos existentes começam com controle desativado porque o inventário legado contém zeros para a maioria dos itens e não comprova disponibilidade física.
- Para um produto com controle ativado, o banco valida e baixa o estoque de forma transacional durante a criação do pedido.
- Não ative o controle antes de conferir a quantidade física e atualizar `produtos.estoque`.

## Custos e despesas
- Criadas tabelas privadas `product_costs` e `business_expenses`, com RLS habilitado e sem acesso para anon/authenticated; acesso administrativo deve passar pela Edge Function autenticada por chave administrativa.
- O painel atual ainda precisa migrar a gravação/leitura de custos e despesas do localStorage para a API segura antes de calcular lucro consolidado multi-dispositivo.

## Limitações ainda abertas
- O valor do frete recebido do navegador ainda precisa de validação por cotação assinada ou recotação server-to-server antes de ser considerado confiável.
- As taxas da InfinitePay e o custo real de postagem precisam ser registrados com dados efetivos do provedor/etiqueta; não devem ser estimados.
- Não foi feito pagamento real nem pedido real durante os testes.
