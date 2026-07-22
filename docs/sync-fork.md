# Sincronização automática com o catálogo base (upstream)

Este guia é para **donos de fork** — lojas que copiaram o repositório base e publicam o site a partir do próprio GitHub (por exemplo na Vercel).

A pipeline **Sync upstream** traz novidades do projeto base (correções, funcionalidades, dependências) para a branch `main` do seu repositório. Quando o push em `main` acontece, o deploy conectado a essa branch roda automaticamente.

## O que você precisa fazer (uma vez)

### 1. Ativar GitHub Actions no fork

1. Abra seu repositório no GitHub.
2. Vá em **Actions**.
3. Se aparecer aviso de workflows desabilitados, clique em **Enable workflows** ou **I understand my workflows, enable them**.

Em forks, o GitHub pode pedir confirmação antes de rodar workflows agendados.

### 2. Criar o secret `UPSTREAM_SYNC_TOKEN`

O repositório base é **privado**. A pipeline precisa de um token só de **leitura** para baixar as atualizações.

1. Peça ao mantenedor do catálogo base um **Personal Access Token** (PAT) ou token fine-grained com permissão de **leitura** no repositório upstream (`joaop06/catalogo`).
2. No **seu** fork: **Settings → Secrets and variables → Actions → New repository secret**.
3. Nome: `UPSTREAM_SYNC_TOKEN`
4. Valor: cole o token fornecido.

Não compartilhe esse token publicamente. Se vazar, peça um token novo ao mantenedor.

### 3. Conferir deploy na `main`

Na Vercel (ou outro host), o projeto deve estar ligado ao **seu** repositório e fazer deploy da branch `main`. A sync não altera variáveis de ambiente (`.env` / secrets da Vercel).

## Como funciona no dia a dia

| Situação | O que a pipeline faz |
|----------|----------------------|
| Só o upstream mudou arquivos que você **não** alterou | Commit em `main` + push → **deploy automático** |
| Você alterou arquivos diferentes dos que o upstream mudou | Mesmo comportamento: seu catálogo/código local é preservado nos arquivos que só você mexeu |
| **Mesmo arquivo** alterado no upstream **e** no seu fork | Abre um **Pull Request** com o que dá para aplicar sem conflito; arquivos em conflito precisam de revisão manual |

### Disparos

- **Agendado:** todo dia por volta das 06:00 (horário de Brasília), conforme cron do workflow.
- **Manual:** **Actions → Sync upstream → Run workflow**.

## Se aparecer um Pull Request de sync

1. Leia a descrição do PR e a mensagem do commit (lista arquivos em conflito).
2. Em **Files changed**, revise o que será mesclado.
3. Para arquivos em conflito, incorpore manualmente as mudanças do upstream que fizerem sentido (ou peça ajuda ao mantenedor).
4. Quando estiver ok, **Merge** do PR na `main` → deploy dispara.

Não é necessário usar **Sync fork** na interface do GitHub se esta pipeline estiver configurada.

## Customização de código

Se você alterou arquivos de aplicação (`src/`, `app/`, etc.) e o upstream também alterou **os mesmos arquivos**, a automação **não** sobrescreve sua versão: você resolve pelo PR. Arquivos que só você ou só o upstream alterou são tratados automaticamente.

O catálogo em `data/` segue a mesma lógica: seu conteúdo permanece quando só a loja alterou aquele arquivo.

## Validação (mantenedor / fork de teste)

Checklist após publicar os workflows no upstream e configurar um fork de teste:

1. **Upstream:** rodar **Sync upstream** no repo base → job deve ser **skipped** (`fork == false`).
2. **Fork com secret:** `workflow_dispatch` → se o upstream só mudou código que o fork não tocou, `main` avança e o deploy roda.
3. **Fork só com mudanças em `data/`:** upstream muda `src/` → push direto em `main` no fork.
4. **Conflito:** fork e upstream alteram o **mesmo** arquivo → PR criada, **sem** push em `main` até merge manual.
5. Confirmar que push em `main` dispara deploy na Vercel do fork.

## Problemas comuns

| Sintoma | Possível causa |
|---------|----------------|
| Workflow não aparece | Actions desabilitadas no fork |
| Falha no fetch upstream | Secret ausente, expirado ou sem leitura no repo base |
| Falha em `npm run build` | Upstream introduziu mudança que quebra build; corrigir localmente ou aguardar fix no base antes de novo sync |
| PR toda semana com conflitos | Mesmos arquivos editados no fork e no upstream — alinhar com mantenedor ou reduzir customizações nos arquivos core |

## Arquivos da pipeline (referência)

- [`.github/workflows/sync-upstream.yml`](../.github/workflows/sync-upstream.yml) — entrada (schedule + manual)
- [`.github/workflows/sync-fork-reusable.yml`](../.github/workflows/sync-fork-reusable.yml) — lógica de fetch, merge e PR
- [`scripts/sync-upstream-merge.mjs`](../scripts/sync-upstream-merge.mjs) — merge inteligente por merge-base
