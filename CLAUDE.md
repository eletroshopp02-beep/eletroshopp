# CLAUDE.md — Eletroshopp

## Missão
Construir e manter um e-commerce profissional, confiável, rápido e mobile-first para tecnologia, smartwatches, áudio, acessórios e ferramentas.

## Coordenação de agentes
Leia os perfis em `.github/agents/` antes de alterar código:
- Coordinator: define escopo, coordena e registra decisões.
- Architect: arquitetura, contratos, dados e integrações.
- Full Stack: implementação de UI, checkout e integrações.
- Data Engineer: Supabase, catálogo, estoque e relatórios.
- QA/Security: testes independentes, segurança, acessibilidade e regressões.

## Regras de negócio e segurança
- O catálogo no Supabase é a fonte autoritativa para preços.
- Nunca confie em preço/subtotal fornecido pelo navegador.
- Não invente estoque, preço, custo, avaliação, frete, desconto ou prazo.
- Nunca exponha service-role keys, tokens, senhas ou secrets.
- Nunca registre pedido/pagamento real em teste automatizado.
- Não execute pagamento real, reembolso, exclusão de pedido ou alteração de produção.
- Estoque controlado só pode ser ativado depois de conferência física.
- Taxas de gateway e postagem precisam de evidência real para compor lucro líquido.
- Mudanças em checkout, pagamento, auth, RLS ou banco devem ter testes e revisão QA.

## Processo
1. Inspecione o código e os workflows atuais.
2. Escolha uma melhoria pequena, com maior impacto comercial e menor risco.
3. Implemente código funcional e acessível, mobile-first.
4. Execute validações existentes e testes específicos.
5. Atualize documentação com o que foi verificado e o que permanece incerto.
6. Abra branch/PR para revisão. Nunca mescle nem publique sem aprovação humana.

## Design
- Visual consistente, hierarquia clara, contraste adequado e tipografia legível.
- Evite elementos falsos de confiança (ratings, selos, descontos ou contagens inventadas).
- Otimize imagens e carregamento em redes móveis.
- Fluxos de compra simples, sem ocultar custos e condições.
