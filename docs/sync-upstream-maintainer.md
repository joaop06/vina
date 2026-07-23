# Upstream — disparar sync nos forks

Configuração **no repositório base** (`joaop06/catalogo` ou equivalente), não nos forks.

## Fluxo

1. Push/merge na **`main`** do base → workflow **Notify forks to sync**.
2. O script [`scripts/dispatch-fork-sync.mjs`](../scripts/dispatch-fork-sync.mjs) lista forks via API e envia `repository_dispatch` (`upstream-sync`) para cada um.
3. No fork, **Sync upstream** roda, commita na **`main`** com autor configurado (`SYNC_COMMIT_*`) e faz push → **deploy na Vercel** (integração Git).

Cron diário no fork continua como **fallback** se algum dispatch falhar.

## Secret no repositório base

| Secret | Valor |
|--------|--------|
| `FORK_DISPATCH_TOKEN` | PAT (classic `repo` ou fine-grained) de uma conta que tenha **escrita** em **cada fork** |

Essa conta costuma ser um **usuário bot** ou o mantenedor, adicionado como colaborador **Maintain** (ou Admin) em todo fork de loja. Sem isso, o dispatch para aquele fork falha (o sync ainda pode rodar no cron).

Permissões mínimas do PAT por fork: **Contents** read/write + **Metadata**; para `repository_dispatch`, **Actions** no repositório alvo.

## `UPSTREAM_SYNC_TOKEN`: guardar ou repassar

O GitHub **só exibe o valor do PAT na hora da criação**. Depois disso não dá para “copiar de novo” na interface.

### Opção recomendada — a loja gera o próprio token

Você **não** precisa guardar nem repassar nada:

1. Convide a conta GitHub da loja como **Read** no repo **base**.
2. A loja cria um fine-grained PAT (Contents **Read-only** no **base**), igual ao passo B.1 em [setup-nova-loja.md](setup-nova-loja.md).
3. A loja cola só no **próprio fork** → secret `UPSTREAM_SYNC_TOKEN`.

Cada fork fica com o PAT da **própria conta** (ou de um bot da loja). Fork novo = mesma receita, sem depender do mantenedor.

### Opção — um PAT “de serviço” seu (vários forks)

Se **você** gera um único token e compartilha com todas as lojas:

1. **Na criação:** guarde o valor em gerenciador de senhas (1Password, Bitwarden, etc.) ou cofre da equipe — trate como senha de produção.
2. **Fork novo:** copie desse cofre e cole no secret do fork (ou envie à loja por canal seguro **uma vez**).
3. **Perdeu o valor:** [regenere o token](https://github.com/settings/personal-access-tokens) (ou crie outro e revogue o antigo) e atualize o secret em **todos** os forks que ainda usavam o antigo. Forks esquecidos param de syncar até atualizar.

Não commite o PAT no git, issue pública ou chat sem criptografia.

### Opção — você cola no fork (sem passar à loja)

Se a conta do `FORK_DISPATCH_TOKEN` for **Maintain** no fork, você pode abrir **Settings → Secrets** do fork da loja e configurar `UPSTREAM_SYNC_TOKEN` você mesmo — a loja nunca vê o valor, mas **você** ainda precisa tê-lo guardado ou regenerar quando surgir fork novo.

## Checklist mantenedor

1. Criar/conta bot (opcional) ou usar conta pessoal dedicada ao dispatch.
2. No base: **Settings → Secrets → Actions** → `FORK_DISPATCH_TOKEN`.
3. Publicar workflows [`sync-notify-forks.yml`](../.github/workflows/sync-notify-forks.yml) na `main`.
4. Garantir que forks novos **puxem** esses workflows (sync ou re-fork) e configurem secrets conforme [setup-nova-loja.md](setup-nova-loja.md).
5. Teste: commit trivial na `main` do base → ver **Actions** no fork (**Sync upstream**) e deploy na Vercel.

## Falhas comuns

| Sintoma | Causa |
|---------|--------|
| Notify ok, fork não roda | Fork sem `repository_dispatch` no workflow (sync antigo) ou Actions desabilitadas |
| `403` no dispatch para um fork | Token sem acesso de escrita naquele repositório |
| Fork sync ok, Vercel não deploya | Secrets `SYNC_COMMIT_NAME` / `SYNC_COMMIT_EMAIL` no fork não batem com a conta dona do projeto na Vercel (plano Hobby) |
