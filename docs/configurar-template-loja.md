# Configurar loja a partir do template

Cada loja é um repositório independente criado a partir do template [`joaop06/vina`](https://github.com/joaop06/vina). O cliente edita **somente** a pasta `data/`. O código vem do repositório base via merge automático.

## 1. Criar o repositório

1. No repo base, use **Use this template → Create a new repository** na conta do cliente.
2. Não use fork: em templates o GitHub Actions já costuma vir habilitado.

## 2. Habilitar Actions e permissões

1. Aba **Actions** → confirme a habilitação dos workflows, se solicitado.
2. **Settings → Actions → General → Workflow permissions** → marque **Read and write permissions**. Sem isso o `git push` do workflow falha.

## 3. Conectar à Vercel

1. Importe o repositório da loja na Vercel (nunca o `joaop06/vina` base).
2. **Production Branch:** `main` (o push do sync dispara o redeploy).
3. Variáveis de ambiente (Production):

| Variável | Valor |
|----------|--------|
| `DATA_BACKEND` | `github` |
| `GITHUB_OWNER` | Dono do repo da loja |
| `GITHUB_REPO` | Nome do repo da loja |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_TOKEN` | PAT com Contents read/write só no repo da loja |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Login do painel |
| `JWT_SECRET` | Segredo longo (≥ 32 caracteres) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site |

## 4. (Opcional) `SYNC_TOKEN`

Necessário **somente** se o workflow precisar atualizar a si mesmo (mudanças em `.github/workflows/`).

1. Gere um PAT **fine-grained** (Settings → Developer settings → Personal access tokens).
2. Conceda acesso aos repositórios de loja com:
   - **Contents:** Read and write
   - **Workflows:** Read and write
3. No repo da loja: **Settings → Secrets and variables → Actions → New repository secret**
   - Nome: `SYNC_TOKEN`
   - Valor: o PAT

Sem `SYNC_TOKEN`, o workflow usa o `GITHUB_TOKEN` padrão — suficiente para merge/push de código e dados fora de `.github/workflows/`.

**Segurança:** um PAT cadastrado no repo da loja dá poder de escrita com a identidade do dono do token. Use fine-grained, restrito aos repositórios necessários e com escopo mínimo.

## 5. Preencher `data/`

O cliente edita os JSONs (e mídia) em `data/` com os dados da loja. **Nada de código dentro de `data/` e nenhum dado fora de `data/`.**

## 6. Como a sync funciona

| Gatilho | Quando |
|---------|--------|
| Cron | Diariamente às 06:00 UTC (03:00 em Brasília) |
| Manual | **Actions → Sync upstream (auto-merge) → Run workflow** |

Fluxo:

1. Você corrige/melhora algo e faz push na `main` do repo base.
2. No horário do cron (ou no disparo manual), o workflow da loja busca o upstream.
3. Faz `git merge upstream/main --no-edit -X ours` e push na `main` da loja.
4. A Vercel detecta o push e faz o redeploy.

## 7. Limitações

- **`-X ours` é silencioso:** se o cliente editar um arquivo de código que você também alterou, a versão dele prevalece naquele arquivo — sem aviso. Mitigação: o cliente só edita `data/`.
- **Cron não é exato:** o GitHub Actions pode atrasar alguns minutos; use `workflow_dispatch` para forçar.
- **Auto-atualização do workflow:** só com `SYNC_TOKEN` (PAT com escopo Workflows).
- **Histórico divergente:** oriente o cliente a **nunca** fazer force-push na `main`.

## 8. Checklist

| Item | Onde |
|------|------|
| Marcar o repo base como Template repository | Settings do `joaop06/vina` |
| Cliente cria repo via template | Conta do cliente |
| Habilitar Actions + Read and write permissions | Repo da loja |
| (Opcional) Cadastrar `SYNC_TOKEN` | Secrets do repo da loja |
| Conectar à Vercel (Production Branch = `main`) | Conta do cliente |
| Preencher `data/` com os dados reais | Repo da loja |
