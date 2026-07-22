import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatApiErrorForUser,
} from "@/src/lib/api/client-error";

describe("formatApiErrorForUser", () => {
  it("expõe mensagens de fieldErrors com rótulo amigável", () => {
    const formatted = formatApiErrorForUser({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: {
        formErrors: [],
        fieldErrors: {
          instagram: [
            "Use só letras, números, ponto e underline (até 30 caracteres)",
          ],
        },
      },
    });
    assert.equal(formatted.title, "Revise os campos");
    assert.ok(
      formatted.lines.some((l) =>
        l.includes("Use só letras, números, ponto e underline"),
      ),
    );
    assert.ok(formatted.lines.some((l) => l.startsWith("Instagram:")));
  });

  it("usa mensagem da API quando não há details Zod", () => {
    const formatted = formatApiErrorForUser({
      code: "NOT_FOUND",
      message: "Produto não encontrado",
    });
    assert.equal(formatted.title, "Não encontrado");
    assert.deepEqual(formatted.lines, ["Produto não encontrado"]);
  });

  it("trata login com credenciais inválidas sem falar em sessão", () => {
    const formatted = formatApiErrorForUser({
      code: "UNAUTHORIZED",
      message: "Credenciais inválidas",
    });
    assert.equal(formatted.title, "Credenciais inválidas");
    assert.deepEqual(formatted.lines, []);
  });

  it("mantém sessão expirada para não autenticado", () => {
    const formatted = formatApiErrorForUser({
      code: "UNAUTHORIZED",
      message: "Não autenticado",
    });
    assert.equal(formatted.title, "Sessão expirada");
    assert.deepEqual(formatted.lines, ["Não autenticado"]);
  });
});

describe("site-config validation flatten", () => {
  it("propaga erro de handle do Instagram no flatten", () => {
    const formatted = formatApiErrorForUser({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: {
        formErrors: [],
        fieldErrors: {
          "instagram.handle": [
            "Use só letras, números, ponto e underline (até 30 caracteres)",
          ],
        },
      },
    });
    assert.ok(
      formatted.lines.some((l) =>
        l.includes("Use só letras, números, ponto e underline"),
      ),
    );
    assert.ok(formatted.lines.some((l) => l.startsWith("Instagram:")));
  });
});
