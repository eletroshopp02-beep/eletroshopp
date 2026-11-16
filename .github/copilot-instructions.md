# Instruções do projeto — Eletroshopp

- Antes de alterar código, identifique a stack, os comandos existentes, a arquitetura e os fluxos afetados.
- Preserve o funcionamento atual da loja, painel administrativo, app do cliente, catálogo, imagens, carrinho, checkout, frete, InfinityPay e WhatsApp.
- Nunca invente credenciais, tokens, URLs privadas ou configurações de gateway. Nunca exponha segredos no frontend, logs ou commits.
- Valide preço, estoque, frete, permissões e estado dos pedidos no servidor sempre que a arquitetura permitir; não confie apenas no cliente.
- Para pagamentos, evite duplicidade de cobrança e confirme estados por mecanismo confiável já adotado pelo projeto.
- Faça mudanças pequenas e compatíveis com os dados existentes. Não apague pedidos nem dados de clientes.
- Execute os testes e verificações disponíveis no repositório. Se não houver testes, informe isso e descreva verificações manuais reproduzíveis.
- Não faça deploy, merge em main, migração destrutiva ou alteração de produção sem autorização explícita.
- Ao concluir, informe arquivos alterados, riscos, testes executados e pendências.
