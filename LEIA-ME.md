# App de consumíveis — versão nova (preço por plano)

Reconstrução do sistema da associação, com **uma mudança central**: o preço não é
mais "valor cheio + % de desconto do plano". Agora **cada item guarda um preço fixo
por plano** — Não assinante, Padawan, Cavaleiro e Mestre. A venda só consulta o
preço certo, sem cálculo de desconto.

## Arquivos

- `index.html` — o app completo (uma página só, mesma cara do original).
- `migrar-precos.js` — converte o backup antigo (preço + %) para o formato novo.
- `LEIA-ME.md` — este guia.

## O que mudou por dentro

- **Item** agora é `{id, nome, cat, qtd, precos:{naoAssinante, padawan, cavaleiro, mestre}}`
  (antes era `{id, nome, cat, preco, qtd}`).
- No cadastro de item (Estoque → Novo/Editar) aparecem **4 campos de preço**.
- Na venda: escolhe o comprador → o catálogo, o carrinho e o total já mostram o
  preço do plano dele (visitante/sem plano usa "Não assinante"). **Sem linha de desconto.**
- A aba Admin não tem mais "Planos & Descontos" com %; virou um card explicativo.
- Foi adicionado **Importar Backup JSON** no Admin (pra carregar os dados migrados).

## Passo a passo (no Claude Code)

1. **Crie um projeto Firebase seu** em https://console.firebase.google.com
   - Crie um **Firestore Database** (modo produção ou teste).
   - Em *Configurações do projeto → Suas apps → Web*, copie `projectId` e `apiKey`.

2. **Cole suas chaves** no topo do `index.html`:
   ```js
   const _FB_PROJECT = 'seu-project-id';
   const _FB_API_KEY = 'sua-web-api-key';
   ```
   > Não use as chaves do site antigo — elas apontam pro banco de outra pessoa.

3. **Exporte os dados do app antigo**: entre logado, Admin → **Exportar Backup JSON**.

4. **Migre os preços**:
   ```bash
   node migrar-precos.js backup_do_app_antigo.json > backup_novo.json
   ```
   Isso preenche os 4 preços de cada item usando os % atuais como ponto de partida.

5. **Importe no app novo**: abra o `index.html`, faça login (Admin), vá em
   Admin → Dados do Sistema → **Importar Backup JSON** e escolha `backup_novo.json`.
   Os dados sobem pra sua nuvem automaticamente.

6. **Ajuste os preços** que quiser (Estoque → Editar item) — agora cada plano tem
   seu próprio valor, item a item.

7. **Publique**: pode ser GitHub Pages (só subir o `index.html`) ou Firebase Hosting.

## Regras do Firestore (importante)

Este app grava direto via REST usando a API key, sem login de usuário no banco.
Isso significa que, com regras abertas, **qualquer um com o link consegue ler/gravar**
— e o login "admin" fica guardado no próprio banco. Para uma ferramenta interna do
clube costuma passar, mas se quiser fechar isso corretamente (Firebase Auth + regras
por usuário), dá pra evoluir depois. Peça ao Claude Code pra "adicionar Firebase Auth
e travar as regras do Firestore" quando quiser subir o nível de segurança.

## Login padrão

Usuário `admin`, senha `gdaae2024` (troque em Admin → Credenciais no primeiro acesso).
