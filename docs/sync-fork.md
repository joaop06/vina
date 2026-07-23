# Sincronização automática com o catálogo base (upstream)

Este guia é para **donos de fork** — lojas que copiaram o repositório base e publicam o site a partir do próprio GitHub (por exemplo na Vercel).

A pipeline **Sync upstream** traz novidades do projeto base para a branch `main` do seu repositório. Commits de sync usam o autor definido em `SYNC_COMMIT_NAME` / `SYNC_COMMIT_EMAIL` (conta GitHub ligada à Vercel) para o deploy automático funcionar, inclusive no plano Hobby.

## O que você precisa fazer (uma vez)

### 1. Ativar GitHub Actions no fork

1. Abra seu repositório no GitHub.
2. Vá em **Actions**.
3. Se aparecer aviso de workflows desabilitados, clique em **Enable workflows** ou **I understand my workflows, enable them**.

Em forks, o GitHub pode pedir confirmação antes de rodar workflows agendados.

### 2. Secrets no fork (Actions)

| Secret | Descrição |
|--------|-----------|
| `UPSTREAM_SYNC_TOKEN` | PAT de **leitura** no upstream privado (`joaop06/catalogo`), fornecido pelo mantenedor |
| `SYNC_COMMIT_NAME` | Nome da conta GitHub **dona do projeto na Vercel** |
| `SYNC_COMMIT_EMAIL` | E-mail primário dessa conta no GitHub (o mesmo que a Vercel associa ao deploy) |

**Settings → Secrets and variables → Actions → New repository secret** para cada um.

Para sync imediato após cada release no base, adicione a conta do dispatch (bot/maintenedor) como colaborador **Maintain** no fork — [sync-upstream-maintainer.md](sync-upstream-maintainer.md).

### 3. Conferir deploy na `main`

Na Vercel, o projeto deve estar ligado ao **seu** fork, branch **`main`**, com a **mesma conta GitHub** dos secrets `SYNC_COMMIT_*`. A sync não altera variáveis de ambiente da Vercel.

## Como funciona no dia a dia

| Situação | O que a pipeline faz |
|----------|----------------------|
| Só o upstream mudou arquivos que você **não** alterou | Commit em `main` (autor Vercel) + push → **deploy automático** |
| Você alterou arquivos diferentes dos que o upstream mudou | Mesmo comportamento: seu catálogo/código local é preservado nos arquivos que só você mexeu |
| **Mesmo arquivo** alterado no upstream **e** no seu fork | Abre um **Pull Request** com o que dá para aplicar sem conflito; arquivos em conflito precisam de revisão manual |
| Upstream já estava aplicado no fork | Sync termina sem commit novo → **sem** push → **sem** deploy desnecessário |

### Disparos

- **Após push na `main` do base:** `repository_dispatch` → sync no fork (requer colaborador dispatch no fork).
- **Agendado:** todo dia ~06:00 BRT (fallback).
- **Manual:** **Actions → Sync upstream → Run workflow**.

## Se aparecer um Pull Request de sync

1. Leia a descrição do PR e a mensagem do commit (lista arquivos em conflito).
2. Em **Files changed**, revise o que será mesclado.
3. Para arquivos em conflito, incorpore manualmente as mudanças do upstream que fizerem sentido (ou peça ajuda ao mantenedor).
4. Quando estiver ok, **Merge** do PR na `main` → deploy dispara (autor = você, na merge).

Não é necessário usar **Sync fork** na interface do GitHub se esta pipeline estiver configurada.

## Customização de código

Se você alterou arquivos de aplicação (`src/`, `app/`, etc.) e o upstream também alterou **os mesmos arquivos**, a automação **não** sobrescreve sua versão: você resolve pelo PR. Arquivos que só você ou só o upstream alterou são tratados automaticamente.

O catálogo em `data/` segue a mesma lógica: seu conteúdo permanece quando só a loja alterou aquele arquivo.

## Validação (mantenedor / fork de teste)

1. **Upstream:** push na `main` → **Notify forks to sync**; job **Sync upstream** no base continua **skipped** (`fork == false`).
2. **Fork:** após dispatch ou `workflow_dispatch`, se upstream mudou só arquivos que o fork não tocou → `main` avança, autor = `SYNC_COMMIT_*`, deploy Vercel.
3. **Fork só com mudanças em `data/`:** upstream muda `src/` → push direto em `main` no fork.
4. **Conflito:** mesmo arquivo nos dois lados → PR, **sem** push em `main` até merge manual.
5. Upstream já sincronizado → workflow ok, sem commit, sem deploy.

## Problemas comuns

| Sintoma | Possível causa |
|---------|----------------|
| Workflow não aparece | Actions desabilitadas no fork |
| Falha no fetch upstream | `UPSTREAM_SYNC_TOKEN` ausente, expirado ou sem leitura no base |
| Sync ok, Vercel não deploya | `SYNC_COMMIT_*` não correspondem à conta dona do projeto na Vercel |
| Base publicou, fork não syncou na hora | Conta do `FORK_DISPATCH_TOKEN` sem acesso Maintain no fork; aguardar cron ou rodar manual |
| Falha em `npm run build` | Upstream quebrou build; corrigir localmente ou aguardar fix no base |
| PR toda semana com conflitos | Mesmos arquivos editados no fork e no upstream |

## Arquivos da pipeline (referência)

- [`.github/workflows/sync-notify-forks.yml`](../.github/workflows/sync-notify-forks.yml) — base: dispara forks após push na `main`
- [`.github/workflows/sync-upstream.yml`](../.github/workflows/sync-upstream.yml) — fork: entrada (dispatch, schedule, manual)
- [`.github/workflows/sync-fork-reusable.yml`](../.github/workflows/sync-fork-reusable.yml) — fetch, merge, autor Vercel, PR
- [`scripts/dispatch-fork-sync.mjs`](../scripts/dispatch-fork-sync.mjs) — lista forks e envia dispatch
- [`scripts/sync-upstream-merge.mjs`](../scripts/sync-upstream-merge.mjs) — merge inteligente por merge-base

Mantenedor do base: [sync-upstream-maintainer.md](sync-upstream-maintainer.md).
