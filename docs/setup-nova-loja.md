# Nova loja (fork) — checklist

Do acesso ao catálogo base privado até o site no ar na Vercel.

## 1. Acesso ao repositório base (privado)

**Mantenedor:** convida a conta GitHub da loja como colaborador com **Read** em `joaop06/catalogo`, ou entrega um **PAT** (fine-grained ou classic) com **leitura** só nesse repositório.

**Loja:** aceita o convite (ou guarda o PAT de leitura para o passo 3).

## 2. Criar o fork

1. No GitHub, abrir o repo base → **Fork**.
2. Destino: conta ou org da loja; branch padrão **`main`**.
3. (Opcional) Clonar, personalizar **`data/`** (catálogo, config da loja, imagens) e dar push na **`main`** do fork.

Evite mudar `src/`, `app/`, etc. sem necessidade — reduz conflitos no sync automático.

## 3. GitHub Actions no fork

1. **Actions** → habilitar workflows (forks podem pedir confirmação).
2. **Settings → Secrets and variables → Actions** → secret **`UPSTREAM_SYNC_TOKEN`** = PAT de **leitura** do upstream (fornecido pelo mantenedor).
3. Teste: **Actions → Sync upstream → Run workflow**.

Comportamento contínuo (cron, PRs de conflito): **[sync-fork.md](sync-fork.md)**.

## 4. Token GitHub para produção (admin grava `data/`)

Criar **outro** PAT na conta da loja (ou bot) com **Contents: Read and write** no repositório **do fork**.

Usado na Vercel — **não** substitui o `UPSTREAM_SYNC_TOKEN`.

## 5. Vercel

1. **Add New Project** → importar o **fork** (mesma conta/org do GitHub conectada).
2. Branch de produção: **`main`**; framework **Next.js** (auto).
3. **Node.js 22+** (Settings → General, se necessário).
4. **Environment Variables** (Production; Preview opcional):

| Variável | Valor |
|----------|--------|
| `DATA_BACKEND` | `github` |
| `GITHUB_TOKEN` | PAT com write no **fork** |
| `GITHUB_OWNER` | dono do fork (user ou org) |
| `GITHUB_REPO` | nome do repo fork |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | credenciais do painel (senha forte) |
| `JWT_SECRET` | string longa (≥32 caracteres) |
| `NEXT_PUBLIC_SITE_URL` | URL final (`https://….vercel.app` ou domínio custom) |

5. Deploy. Se o domínio mudar, atualizar `NEXT_PUBLIC_SITE_URL` e redeploy.
6. Validar: vitrine, login admin, salvar no painel → commit em `data/` no GitHub do fork.

## 6. Pós-go-live

- Push na **`main`** (sync ou merge de PR) → redeploy na Vercel.
- PR **Sync upstream** → revisar → merge na **`main`** → deploy.
- Não usar **Sync fork** do GitHub se a pipeline estiver ativa.

## Tokens (resumo)

| Onde | Nome | Permissão | Função |
|------|------|-----------|--------|
| GitHub Actions (fork) | `UPSTREAM_SYNC_TOKEN` | Leitura no **upstream** | Baixar atualizações do base |
| Vercel | `GITHUB_TOKEN` | Escrita no **fork** | Persistir alterações do admin em `data/` |
