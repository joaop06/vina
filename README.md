# PÉ QUENTE

Monólito Next.js (vitrine + admin) com persistência em `data/` (JSON + imagens).

- **Dev (`next dev`):** sempre filesystem sob `data-dev/` (gitignored; `DATA_BACKEND` ignorado)
- **Prod (Vercel):** `DATA_BACKEND=github` — commits em `data/` via GitHub API

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev:restore:data   # copia data/ → data-dev/
npm run dev
```

Dados locais: `npm run dev:reset:data` limpa `data-dev/` e restaura o seed de `data/`. `npm run dev:seed` faz o reset e popula `data-dev/` com catálogo grande (pedidos, clientes, analytics) para testar admin/dashboard.

### Baseline de leitura (Fase 0)

Com o servidor no ar (`npm run dev` ou prod):

```bash
npm run baseline:read
# Prod:
# npm run baseline:read -- --base-url=https://SEU_DOMINIO --env=production-github
```

Gera `docs/baseline-escalabilidade-leitura.md` + `.json`. Checklist: `docs/checklist-escalabilidade-leitura.md`.

### Fase 6 — re-medição + anti-padrões

Com o servidor no ar (após Fases 1–5):

```bash
npm run phase6:verify
# npm run phase6:verify -- --strict
# npm run phase6:verify -- --base-url=https://SEU_DOMINIO --env=production-github-phase6 --strict
```

Arquiva o baseline da Fase 0 em `docs/archive/` (uma vez) e grava `docs/pos-otimizacao-escalabilidade-leitura.md` + `.json`. O gate estático de anti-padrões também roda em `npm test`.

Admin default (dev): usuário `admin` / senha `admin123` (defina `ADMIN_PASSWORD` forte em produção).

Node.js **22+** obrigatório.
