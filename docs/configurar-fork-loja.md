# Configurar fork da loja

Guia para publicar o **Vina** a partir do seu próprio repositório no GitHub e na Vercel.

O catálogo base é público: [github.com/joaop06/vina](https://github.com/joaop06/vina). Você **não** precisa ser colaborador desse repositório — basta criar um **fork** na sua conta.

---

## 1. Criar o fork

1. Abra [joaop06/vina](https://github.com/joaop06/vina).
2. Clique em **Fork** e escolha **sua conta** (ou a org da loja).
3. Deixe a branch **main** como padrão.
4. Personalize o catálogo em `data/` (produtos, site, imagens) ou use o painel admin depois do deploy.

Evite alterar `src/` ou `app/` sem necessidade — isso aumenta conflitos quando o base for atualizado.

---

## 2. GitHub Actions no fork

1. No **seu fork**: **Settings → Actions → General** → permita workflows (e confirme workflows agendados, se o GitHub pedir).
2. **Settings → Secrets and variables → Actions** → crie dois secrets (copie do seu perfil GitHub, **não** são PATs):

| Secret | Valor |
|--------|--------|
| `SYNC_COMMIT_NAME` | Nome público da conta GitHub ligada ao projeto na Vercel |
| `SYNC_COMMIT_EMAIL` | E-mail principal ou `noreply` da mesma conta |

Esses valores definem o **autor** dos commits de sincronização e também dos commits automáticos do workflow **Data indices** (reparo de `data/indices/`). A Vercel (plano Hobby) só dispara deploy automático se o autor do push for a mesma conta conectada ao projeto.

3. O workflow **CI** roda em todo PR e push na `main` (lint, testes, validação de índices em `data/`, build). PR com catálogo inconsistente **não passa** — corrija com `npm run indices:repair -- --data=data` antes do merge.

4. O workflow **Data indices** roda em **push na `main`** quando `data/` (ou código de índice) muda: se a validação falhar, repara `data/indices/`, commita e dá push (útil se você editou só `data/produtos/*.json` direto no GitHub).

Prefira criar produtos pelo admin (índices atualizados no mesmo commit) ou rode `npm run indices:repair -- --data=data` localmente antes do push.

---

## 3. Testar sincronização com o base

1. **Actions → Sync upstream → Run workflow**.
2. Resultados possíveis:
   - **Sem commit novo** — seu fork já está alinhado com o base.
   - **Push na `main`** — mudanças do base aplicadas; deploy na Vercel após o passo 4.
   - **Pull Request aberto** — o base e você alteraram **os mesmos arquivos**; revise o PR, mescle o que fizer sentido e faça merge na `main`.

Não use o botão **Sync fork** do GitHub se esta pipeline estiver ativa.

---

## 4. Vercel

1. Importe o projeto a partir do **fork** (nunca do repositório `joaop06/vina`).
2. Branch de produção: **`main`**.
3. Use a **mesma conta GitHub** dos secrets `SYNC_COMMIT_*`.

Variáveis de ambiente (Production):

| Variável | Valor |
|----------|--------|
| `DATA_BACKEND` | `github` |
| `GITHUB_OWNER` | Dono do fork (usuário ou org da loja) |
| `GITHUB_REPO` | Nome do repo fork (ex.: `vina`) |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_TOKEN` | PAT com **escrita** só no **fork** (Contents read/write) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Login do painel (senha forte) |
| `JWT_SECRET` | Segredo longo (≥ 32 caracteres) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site na Vercel |

**Dois tokens diferentes:** o `GITHUB_TOKEN` na Vercel **grava** no fork (admin → `data/`). Os secrets de Actions **não** substituem esse token — servem só para autor de commit no sync.

### Criar `GITHUB_TOKEN` (Vercel)

1. GitHub → **Settings → Developer settings → Personal access tokens** (fine-grained recomendado).
2. **Repository access:** somente o **fork**.
3. **Contents:** read and write.
4. Cole na Vercel como `GITHUB_TOKEN`.

---

## 5. Atualizações do catálogo base

- **Automático:** workflow **Sync upstream** roda todo dia (~06:00 BRT).
- **Manual:** **Actions → Sync upstream → Run workflow** quando quiser puxar novidades na hora.

O que a pipeline faz:

| Situação | Comportamento |
|----------|----------------|
| Só o base mudou arquivos que você não alterou | Commit na `main` + push → deploy |
| Você e o base mudaram arquivos **diferentes** | Mesmo: suas alterações em `data/` são preservadas |
| **Mesmo arquivo** alterado nos dois lados | PR para revisão manual |
| Fork já está atualizado | Workflow ok, sem push, sem deploy extra |

---

## 6. Problemas comuns

| Sintoma | O que verificar |
|---------|------------------|
| Workflow **Sync upstream** não aparece | Actions desabilitadas no fork; faça pull da `main` do base se o fork for antigo |
| Vercel não deploya após sync | `SYNC_COMMIT_NAME` / `SYNC_COMMIT_EMAIL` batem com a conta do projeto na Vercel |
| Falha em `npm run build` no workflow | Erro no código vindo do base ou conflito não resolvido — corrija localmente ou no PR |
| PR de sync toda semana | Você editou os mesmos arquivos de app que o base (`src/`, `app/`, etc.) |

Referência técnica: [`.github/workflows/sync-upstream.yml`](../.github/workflows/sync-upstream.yml), [`.github/workflows/sync-fork-reusable.yml`](../.github/workflows/sync-fork-reusable.yml).

---

## Mantenedor do catálogo base

Repositório **público** na conta pessoal (`joaop06/vina`). Publicar na **`main`**; cada loja sincroniza pelo próprio fork (cron ou manual). **Não** é necessário convidar lojas como colaboradoras, nem configurar secrets no base por causa dos forks.
