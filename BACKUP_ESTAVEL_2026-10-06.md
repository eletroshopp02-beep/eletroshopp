# BACKUP ESTAVEL — Eletroshopp — 2026-10-06

## Estado salvo
Este branch preserva o estado funcional da Eletroshopp em 06/10/2026, antes da integração de pagamentos InfinitePay.

Commit-base do backup:
be8d031ffe7425a44ea765d9239e01fce9557216

Branch de backup:
backup-estavel-2026-10-06

## Produção
- Loja: https://eletroshopp.com.br
- Admin: https://eletroshopp.com.br/admin
- Supabase project: sybxbyaywznbwipbssso

## Loja
- Loja PWA isolada em /loja/
- Manifest com scope /loja/
- Service Worker da loja separado
- Catálogo atual preservado
- Origem de frete: CEP 84272-402
- WhatsApp da loja: 5542998157736

## Administração
- Painéis: Resumo, Financeiro, Contabilidade e Pedidos
- PWA administrativo com scope /admin/
- Seleção individual de pedidos
- Selecionar todos
- Exclusão de pedidos selecionados com confirmação
- Impressão de pedido
- Impressão de etiqueta de envio
- CEP do remetente da etiqueta: 84272-402
- Cache do admin versionado até admin-sw-v7.js
- PIN administrativo não é registrado neste arquivo

## Supabase / funções existentes
- admin-orders
- create-order
- frenet-quote
- melhorenvio-quote
- admin-app
- eletroshopp-admin-app
- admin-panel

## Contabilidade
- Custos por produto
- Despesas da loja
- Ranking de lucro
- Análise mensal
- Dados contábeis locais no navegador (localStorage)

## Regra para próximas alterações
Não alterar a versão-base sem criar um novo commit. Em caso de problema, usar este branch como ponto de restauração.

## Pagamentos
A integração InfinitePay ainda NÃO foi iniciada neste backup.
A configuração atual da loja/painel deve ser preservada antes de qualquer alteração de checkout.
