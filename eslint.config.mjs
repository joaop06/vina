import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const srcLibPaths = [
  {
    name: "@/src/lib",
    message: "src/lib foi removido; o destino é src/foundation.",
  },
];

const srcLibPatterns = [
  {
    group: ["@/src/lib/**"],
    message: "src/lib foi removido; o destino é src/foundation.",
  },
];

/** Alias + relative patterns that ban sibling layout folders (not self). */
function siblingLayoutPatterns(self) {
  const ids = ["classic", "split", "gallery", "atelie"].filter((id) => id !== self);
  const patterns = [];
  for (const id of ids) {
    patterns.push(
      `@/components/public/layouts/${id}`,
      `@/components/public/layouts/${id}/**`,
      `../${id}`,
      `../${id}/**`,
      `../../${id}`,
      `../../${id}/**`,
      `../../../${id}`,
      `../../../${id}/**`,
    );
  }
  return patterns;
}

function layoutBoundaryConfig(layoutId) {
  return {
    files: [`components/public/layouts/${layoutId}/**/*.{js,jsx,ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/src/foundation/data",
              message:
                "Layout não importa foundation/data; consome props já carregadas.",
            },
            {
              name: "@/src/services",
              message:
                "Layout não importa services; use schemas, behaviors ou kit.",
            },
            ...srcLibPaths,
            {
              name: "fs",
              message: "Layout não lê disco; não use fs.",
            },
            {
              name: "node:fs",
              message: "Layout não lê disco; não use fs.",
            },
            {
              name: "node:fs/promises",
              message: "Layout não lê disco; não use fs.",
            },
          ],
          patterns: [
            {
              group: [
                "@/src/foundation/data/**",
                "@/src/services/**",
                "@/src/lib/**",
                ...siblingLayoutPatterns(layoutId),
              ],
              message:
                "Layout: sem services/data/lib e sem layouts irmãos (só o registry compõe).",
            },
          ],
        },
      ],
    },
  };
}

const layoutFolderPatterns = [
  "@/components/public/layouts/classic",
  "@/components/public/layouts/classic/**",
  "@/components/public/layouts/split",
  "@/components/public/layouts/split/**",
  "@/components/public/layouts/gallery",
  "@/components/public/layouts/gallery/**",
  "@/components/public/layouts/atelie",
  "@/components/public/layouts/atelie/**",
];

const layoutRelativePatterns = [
  "../classic",
  "../classic/**",
  "../split",
  "../split/**",
  "../gallery",
  "../gallery/**",
  "../atelie",
  "../atelie/**",
  "../../classic",
  "../../classic/**",
  "../../split",
  "../../split/**",
  "../../gallery",
  "../../gallery/**",
  "../../atelie",
  "../../atelie/**",
  "../layouts/classic",
  "../layouts/classic/**",
  "../layouts/split",
  "../layouts/split/**",
  "../layouts/gallery",
  "../layouts/gallery/**",
  "../layouts/atelie",
  "../layouts/atelie/**",
  "../../layouts/classic",
  "../../layouts/classic/**",
  "../../layouts/split",
  "../../layouts/split/**",
  "../../layouts/gallery",
  "../../layouts/gallery/**",
  "../../layouts/atelie",
  "../../layouts/atelie/**",
];

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // Global ban first; more specific overrides below replace this rule for their files,
  // so each specific block re-includes the @/src/lib restriction.
  {
    files: [
      "src/**/*.{js,jsx,ts,tsx}",
      "app/**/*.{js,jsx,ts,tsx}",
      "components/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: srcLibPaths,
          patterns: srcLibPatterns,
        },
      ],
    },
  },

  layoutBoundaryConfig("classic"),
  layoutBoundaryConfig("split"),
  layoutBoundaryConfig("gallery"),
  layoutBoundaryConfig("atelie"),

  {
    files: ["components/public/kit/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/public/layouts",
              message:
                "Kit não importa layouts; use schemas, behaviors e components/ui.",
            },
            ...srcLibPaths,
          ],
          patterns: [
            {
              group: [
                "@/components/public/layouts/**",
                ...layoutFolderPatterns,
                ...layoutRelativePatterns,
              ],
              message:
                "Kit não importa pasta de layout; dependa só de schemas e behaviors.",
            },
            ...srcLibPatterns,
          ],
        },
      ],
    },
  },

  {
    files: ["components/admin/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: srcLibPaths,
          patterns: [
            {
              group: layoutFolderPatterns,
              message:
                "Admin não importa arquivo interno de layouts/<id>/; use getLayout, contract, options ou banner-slots.",
            },
            ...srcLibPatterns,
          ],
        },
      ],
    },
  },

  {
    files: ["src/services/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components",
              message:
                "Service não importa components/; use schemas, foundation/data ou indices.",
            },
            ...srcLibPaths,
          ],
          patterns: [
            {
              group: [
                "@/components/**",
                "**/components/**",
                "../../components",
                "../../components/**",
                "../../../components",
                "../../../components/**",
              ],
              message:
                "Service não importa components/; use schemas, foundation/data ou indices.",
            },
            ...srcLibPatterns,
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
