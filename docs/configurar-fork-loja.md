# Configurar fork da loja

## 1. Criar fork

- 1.1. Crie um fork do repo base [joaop06/vina](https://github.com/joaop06/vina)
- 1.2. No fork, crie a branch `vercel` a partir de `main` e defina-a como default

## 2. Configuração do fork

### 2.1. Habilitar Actions

- 2.1.1. **Settings → Actions → General** → permita workflows
- 2.1.2. Aba **Actions** → se aparecer aviso, clique em **I understand my workflows, go ahead and enable them**
- 2.1.3. Em **Sync fork** e **Release vercel**, clique em **Enable workflow** se aparecer (`disabled_fork`)

### 2.2. Gerar token (`SYNC_COMMIT_TOKEN`)

No perfil GitHub da conta dona do projeto na Vercel:

- 2.2.1. **Settings → Developer settings → Personal access tokens → Fine-grained tokens** → **Generate new token**
- 2.2.2. **Resource owner:** conta (ou org) dona do fork
- 2.2.3. **Repository access:** somente o fork (nunca o `joaop06/vina`)
- 2.2.4. **Permissions:**

| Permissão | Nível |
|-----------|--------|
| Contents | Read and write |
| Metadata | Read-only |
| Pull requests | Read and write |
| Workflows | Read and write |

- 2.2.5. Gere e guarde o token

### 2.3. Secrets no fork

**Settings → Secrets and variables → Actions** → crie:

| Secret | Valor |
|--------|--------|
| `SYNC_COMMIT_NAME` | Nome público da conta GitHub ligada à Vercel |
| `SYNC_COMMIT_EMAIL` | E-mail (ou `noreply`) da mesma conta |
| `SYNC_COMMIT_TOKEN` | Token do passo 2.2 |

### 2.4. Testar Sync fork

- 2.4.1. **Actions → Sync fork → Run workflow**
- 2.4.2. Confirme push na `main` (ou PR, se houver conflito). Em seguida roda **Release vercel**

## 3. Vercel

- 3.1. Importe o projeto a partir do **fork** (nunca de `joaop06/vina`)
- 3.2. **Production Branch:** `vercel`
- 3.3. Use a mesma conta GitHub dos secrets `SYNC_COMMIT_*`
- 3.4. Variáveis de ambiente (Production):

| Variável | Valor |
|----------|--------|
| `DATA_BACKEND` | `github` |
| `GITHUB_OWNER` | Dono do fork |
| `GITHUB_REPO` | Nome do repo fork |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_TOKEN` | PAT com Contents read/write só no fork (pode ser o mesmo do 2.2) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Login do painel |
| `JWT_SECRET` | Segredo longo (≥ 32 caracteres) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site |

## 4. Pipelines

| Pipeline | Fluxo | Quando |
|----------|--------|--------|
| **Sync fork** | base `main` → fork `main` | Cron 10 min + manual |
| **Release vercel** | fork `main` → `vercel` | Push na `main` + manual |
