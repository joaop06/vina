"use client";

import type {
  AtelieHeroBotaoAcao,
  AtelieHeroBotaoEstilo,
  AtelieHeroConfig,
  AtelieHeroMidiaTipo,
  AtelieHeroTextoModo,
  SiteConfig,
} from "@/src/schemas";
import { FieldHint } from "@/components/admin/shell/FieldHint";
import styles from "./AtelieHeroFields.module.css";

export type AtelieMidiaDraft = { id: string; file: File };

const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 20 * 1024 * 1024;

type TextoKey = {
  [K in keyof AtelieHeroConfig]: AtelieHeroConfig[K] extends {
    modo: AtelieHeroTextoModo;
    texto: string;
  }
    ? K
    : never;
}[keyof AtelieHeroConfig];

const TEXTOS: {
  key: TextoKey;
  label: string;
  hint: string;
  herdavel: boolean;
  rows?: number;
}[] = [
  {
    key: "eyebrow",
    label: "Linha acima do título",
    hint: "Por padrão usa a assinatura da loja.",
    herdavel: true,
  },
  {
    key: "titulo",
    label: "Título",
    hint: "Por padrão usa o nome da loja.",
    herdavel: true,
    rows: 2,
  },
  {
    key: "tituloDestaque",
    label: "Frase em itálico",
    hint: "Aparece em dourado, abaixo do título. Sem texto da loja para herdar.",
    herdavel: false,
    rows: 2,
  },
  {
    key: "texto",
    label: "Parágrafo",
    hint: "Por padrão usa o slogan.",
    herdavel: true,
    rows: 3,
  },
  {
    key: "nota",
    label: "Nota",
    hint: "Linha curta com ícone, abaixo dos botões. Sem texto da loja para herdar.",
    herdavel: false,
    rows: 2,
  },
  {
    key: "legendaTitulo",
    label: "Cartão da foto — título",
    hint: "Sobre a foto. O cartão some se título e texto estiverem vazios.",
    herdavel: false,
  },
  {
    key: "legendaTexto",
    label: "Cartão da foto — texto",
    hint: "Linha menor, abaixo do título do cartão.",
    herdavel: false,
    rows: 2,
  },
];

export function AtelieHeroFields({
  config,
  disabled,
  midiaDraft,
  onMidiaDraft,
  onConfigChange,
}: {
  config: SiteConfig;
  disabled?: boolean;
  midiaDraft: AtelieMidiaDraft | null;
  onMidiaDraft: (next: AtelieMidiaDraft | null) => void;
  onConfigChange: (next: SiteConfig) => void;
}) {
  const hero = config.atelie.hero;
  const midia = hero.midia;

  function patch(next: Partial<AtelieHeroConfig>) {
    onConfigChange({
      ...config,
      atelie: {
        ...config.atelie,
        hero: { ...hero, ...next },
      },
    });
  }

  function patchMidia(next: Partial<AtelieHeroConfig["midia"]>) {
    patch({ midia: { ...midia, ...next } });
  }

  function clearFile() {
    onMidiaDraft(null);
  }

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>
          Textos do topo
          <FieldHint text="Cada bloco pode usar o texto da loja, um texto só deste modelo, ou ficar oculto. Campo vazio não aparece na página." />
        </h3>
        <p className={styles.desc}>
          A moldura aceita foto ou vídeo, por arquivo ou por link.
        </p>
      </header>

      <MidiaFields
        midia={midia}
        disabled={disabled}
        midiaDraft={midiaDraft}
        onMidiaDraft={onMidiaDraft}
        onChange={patchMidia}
        onClearFile={clearFile}
      />

      <div className={styles.grid}>
        {TEXTOS.map((field) => {
          const value = hero[field.key];
          return (
            <label key={field.key} className={styles.field}>
              <span className="admin-field-label">
                {field.label}
                <FieldHint text={field.hint} />
              </span>
              <select
                className="input"
                value={value.modo}
                disabled={disabled}
                onChange={(e) =>
                  patch({
                    [field.key]: {
                      ...value,
                      modo: e.target.value as AtelieHeroTextoModo,
                    },
                  })
                }
              >
                {field.herdavel ? (
                  <option value="herdar">Usar o da loja</option>
                ) : null}
                <option value="proprio">Texto deste modelo</option>
                <option value="oculto">Ocultar</option>
              </select>
              {value.modo === "proprio" ? (
                <textarea
                  className="input"
                  rows={field.rows ?? 1}
                  value={value.texto}
                  disabled={disabled}
                  onChange={(e) =>
                    patch({
                      [field.key]: { ...value, texto: e.target.value },
                    })
                  }
                />
              ) : null}
            </label>
          );
        })}
      </div>

      <div className={styles.buttons}>
        <BotaoFields
          title="Botão principal"
          hint="Por padrão é um link “ver coleção” para o catálogo."
          value={hero.botaoPrimario}
          disabled={disabled}
          onChange={(botaoPrimario) => patch({ botaoPrimario })}
        />
        <BotaoFields
          title="Botão secundário"
          hint="Por padrão abre o WhatsApp, se ele estiver ligado na loja."
          value={hero.botaoSecundario}
          disabled={disabled}
          onChange={(botaoSecundario) => patch({ botaoSecundario })}
        />
      </div>
    </div>
  );
}

function BotaoFields({
  title,
  hint,
  value,
  disabled,
  onChange,
}: {
  title: string;
  hint: string;
  value: AtelieHeroConfig["botaoPrimario"];
  disabled?: boolean;
  onChange: (next: AtelieHeroConfig["botaoPrimario"]) => void;
}) {
  const custom = value.acao === "link" || value.acao === "whatsapp";

  return (
    <fieldset className={styles.button} disabled={disabled}>
      <legend className="admin-field-label">
        {title}
        <FieldHint text={hint} />
      </legend>
      <label className={styles.field}>
        <span className="admin-field-label">Aparência</span>
        <select
          className="input"
          value={value.estilo}
          onChange={(e) =>
            onChange({
              ...value,
              estilo: e.target.value as AtelieHeroBotaoEstilo,
            })
          }
        >
          <option value="preenchido">Preenchido</option>
          <option value="contorno">Contorno</option>
        </select>
      </label>
      <label className={styles.field}>
        <span className="admin-field-label">Ação</span>
        <select
          className="input"
          value={value.acao}
          onChange={(e) =>
            onChange({
              ...value,
              acao: e.target.value as AtelieHeroBotaoAcao,
            })
          }
        >
          <option value="herdar">Usar o padrão</option>
          <option value="link">Link</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="oculto">Ocultar</option>
        </select>
      </label>
      {custom ? (
        <label className={styles.field}>
          <span className="admin-field-label">Rótulo</span>
          <input
            className="input"
            value={value.rotulo}
            maxLength={80}
            onChange={(e) => onChange({ ...value, rotulo: e.target.value })}
          />
        </label>
      ) : null}
      {value.acao === "link" ? (
        <label className={styles.field}>
          <span className="admin-field-label">
            Endereço
            <FieldHint text="Caminho começando com / ou URL http(s)." />
          </span>
          <input
            className="input"
            value={value.href}
            maxLength={500}
            placeholder="/catalogo"
            onChange={(e) => onChange({ ...value, href: e.target.value })}
          />
        </label>
      ) : null}
      {value.acao === "whatsapp" ? (
        <label className={styles.field}>
          <span className="admin-field-label">
            Mensagem
            <FieldHint text="Vazia usa a mensagem padrão do WhatsApp." />
          </span>
          <textarea
            className="input"
            rows={2}
            value={value.mensagem}
            maxLength={500}
            onChange={(e) => onChange({ ...value, mensagem: e.target.value })}
          />
        </label>
      ) : null}
    </fieldset>
  );
}

function fileWithType(file: File, tipo: "foto" | "video"): File {
  if (file.type) return file;
  const name = file.name.toLowerCase();
  const type =
    tipo === "foto"
      ? name.endsWith(".png")
        ? "image/png"
        : "image/jpeg"
      : name.endsWith(".webm")
        ? "video/webm"
        : "video/mp4";
  return new File([file], file.name, { type });
}

function validateMidiaFile(file: File, tipo: "foto" | "video"): string | null {
  if (tipo === "foto") {
    if (!IMAGE_TYPES.has(file.type)) return "Use JPEG ou PNG.";
    if (file.size > IMAGE_MAX) return "Imagem maior que 10 MB.";
    return null;
  }
  if (!VIDEO_TYPES.has(file.type)) return "Use MP4 ou WebM.";
  if (file.size > VIDEO_MAX) return "Vídeo maior que 20 MB.";
  return null;
}

function MidiaFields({
  midia,
  disabled,
  midiaDraft,
  onMidiaDraft,
  onChange,
  onClearFile,
}: {
  midia: AtelieHeroConfig["midia"];
  disabled?: boolean;
  midiaDraft: AtelieMidiaDraft | null;
  onMidiaDraft: (next: AtelieMidiaDraft | null) => void;
  onChange: (next: Partial<AtelieHeroConfig["midia"]>) => void;
  onClearFile: () => void;
}) {
  const showSource = midia.tipo !== "nenhuma";
  const pendingName = midiaDraft?.file.name;

  function setTipo(tipo: AtelieHeroMidiaTipo) {
    onClearFile();
    onChange({ tipo, arquivo: null });
  }

  return (
    <div className={styles.buttons}>
      <label className={styles.field}>
        <span className="admin-field-label">Mídia da moldura</span>
        <select
          className="input"
          value={midia.tipo}
          disabled={disabled}
          onChange={(e) => setTipo(e.target.value as AtelieHeroMidiaTipo)}
        >
          <option value="nenhuma">Nenhuma</option>
          <option value="foto">Foto</option>
          <option value="video">Vídeo</option>
        </select>
      </label>

      {showSource ? (
        <label className={styles.field}>
          <span className="admin-field-label">Origem</span>
          <select
            className="input"
            value={midia.origem}
            disabled={disabled}
            onChange={(e) => {
              const origem = e.target.value as AtelieHeroConfig["midia"]["origem"];
              onClearFile();
              onChange({
                origem,
                arquivo: origem === "link" ? null : midia.arquivo,
              });
            }}
          >
            <option value="upload">Upload</option>
            <option value="link">Link</option>
          </select>
        </label>
      ) : null}

      {showSource && midia.origem === "upload" ? (
        <div className={styles.field}>
          <span className="admin-field-label">
            Arquivo
            <FieldHint
              text={
                midia.tipo === "foto"
                  ? "JPEG ou PNG, até 10 MB."
                  : "MP4 ou WebM, até 20 MB. Para vídeos longos, use um link do YouTube ou Vimeo."
              }
            />
          </span>
          <input
            className="input"
            type="file"
            accept={midia.tipo === "foto" ? "image/jpeg,image/png" : "video/mp4,video/webm"}
            disabled={disabled}
            onChange={(e) => {
              const picked = e.target.files?.[0];
              e.target.value = "";
              if (!picked || midia.tipo === "nenhuma") return;
              const file = fileWithType(picked, midia.tipo);
              const error = validateMidiaFile(file, midia.tipo);
              if (error) {
                window.alert(error);
                return;
              }
              const id = crypto.randomUUID();
              onMidiaDraft({ id, file });
              onChange({ arquivo: { id, path: "" } });
            }}
          />
          {pendingName ? <span className={styles.desc}>{pendingName}</span> : null}
          {!pendingName && midia.arquivo?.path ? (
            <span className={styles.desc}>Arquivo já enviado</span>
          ) : null}
          {midia.arquivo ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={disabled}
              onClick={() => {
                onClearFile();
                onChange({ arquivo: null });
              }}
            >
              Remover arquivo
            </button>
          ) : null}
        </div>
      ) : null}

      {showSource && midia.origem === "link" ? (
        <label className={styles.field}>
          <span className="admin-field-label">
            Endereço
            <FieldHint
              text={
                midia.tipo === "foto"
                  ? "URL http(s) da imagem."
                  : "URL direta de MP4 ou WebM, ou um link do YouTube ou Vimeo."
              }
            />
          </span>
          <input
            className="input"
            value={midia.url}
            maxLength={500}
            disabled={disabled}
            placeholder="https://"
            onChange={(e) => onChange({ url: e.target.value })}
          />
        </label>
      ) : null}

      {showSource ? (
        <label className={styles.field}>
          <span className="admin-field-label">Texto alternativo</span>
          <input
            className="input"
            value={midia.alt}
            maxLength={200}
            disabled={disabled}
            onChange={(e) => onChange({ alt: e.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
}
