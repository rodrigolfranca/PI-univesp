import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "../../test/fixtures";
import {
  logoutSession,
  requestLoginCode,
  requestRecoveryEmailCode,
  requestRecoveryPhoneCode,
  requestSignupCode,
  resendSignupCode,
  resendSignupPhoneCode,
  verifyLoginCode,
  verifyRecoveryEmailCode,
  verifyRecoveryPhoneCode,
  verifySignupEmailCode,
  verifySignupPhoneCode,
} from "./auth";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./categories";
import {
  requestContactChange,
  requestEmailConfirmation,
  verifyContactChange,
} from "./contact-change";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnectUrl,
  getGoogleCalendarStatus,
  syncGoogleCalendar,
} from "./google-calendar";
import {
  createProcedure,
  deleteProcedure,
  getProcedure,
  listProcedures,
  updateProcedure,
  type ProcedurePayload,
} from "./procedures";
import { createPop, deletePop, downloadPop, listPops, updatePop } from "./pops";

const procedurePayload: ProcedurePayload = {
  name: "Limpeza",
  description: "Descrição",
  duration_minutes: 30,
  price: 100,
  sessions: 1,
  triagem: false,
  triagem_minutes: 0,
  bloqueio_periodo: null,
  category_id: 1,
  status: "active",
};

afterEach(() => vi.unstubAllGlobals());

describe("auth service", () => {
  it("envia credenciais de login, recuperação e logout", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ expires_in: 300, resend_after: 90 }))
      .mockResolvedValueOnce(jsonResponse({ access_token: "jwt" }))
      .mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestLoginCode("(11) 91234-5678")).resolves.toEqual({
      expires_in: 300,
      resend_after: 90,
    });
    await expect(verifyLoginCode("11912345678", "123456")).resolves.toBe("jwt");
    await logoutSession("jwt");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["/api/auth/request-code", "POST"],
      ["/api/auth/verify-code", "POST"],
      ["/api/auth/logout", "POST"],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      phone_number: "11912345678",
    });
  });

  it("recupera a conta em etapas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ recovery_id: "recovery-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(jsonResponse({ message: "E-mail confirmado" }))
      .mockResolvedValueOnce(jsonResponse({ expires_in: 300, resend_after: 90 }))
      .mockResolvedValueOnce(jsonResponse({ message: "Telefone atualizado" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestRecoveryEmailCode("a@b.com")).resolves.toEqual({
      recovery_id: "recovery-1",
      expires_in: 300,
      resend_after: 90,
    });
    await verifyRecoveryEmailCode("recovery-1", "111111");
    await expect(requestRecoveryPhoneCode("recovery-1", "(11) 91234-5678")).resolves.toEqual({
      expires_in: 300,
      resend_after: 90,
    });
    await verifyRecoveryPhoneCode("recovery-1", "11912345678", "222222");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/auth/recovery/request-email-code",
      "/api/auth/recovery/verify-email-code",
      "/api/auth/recovery/request-phone-code",
      "/api/auth/recovery/verify-phone-code",
    ]);
  });
});

describe("categorias e procedimentos", () => {
  it("gerencia categorias", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: "Geral" }]))
      .mockResolvedValueOnce(jsonResponse({ id: 2, name: "Nova" }))
      .mockResolvedValueOnce(jsonResponse({ id: 2, name: "Editada" }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listCategories()).resolves.toEqual([{ id: 1, name: "Geral" }]);
    await createCategory("Nova", "token");
    await updateCategory(2, "Editada", "token");
    await deleteCategory(2, "token");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["/api/categories", "GET"],
      ["/api/categories", "POST"],
      ["/api/categories/2", "PATCH"],
      ["/api/categories/2", "DELETE"],
    ]);
  });

  it("gerencia procedimentos e traduz 404", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: 1 }]))
      .mockResolvedValueOnce(jsonResponse({ id: 1 }))
      .mockResolvedValueOnce(jsonResponse({ message: "not found" }, 404))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listProcedures()).resolves.toEqual([{ id: 1 }]);
    await expect(getProcedure(1)).resolves.toEqual({ id: 1 });
    await expect(getProcedure(99)).rejects.toThrow("Procedimento não encontrado.");
    await createProcedure(procedurePayload, "token");
    await updateProcedure(2, { price: 120 }, "token");
    await deleteProcedure(2, "token");

    expect(fetchMock.mock.calls[3][1].body).toBe(JSON.stringify(procedurePayload));
  });
});

describe("pops, contato e Google Calendar", () => {
  it("pagina e gerencia POPs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ total: 2, page: 1, limit: 100, pops: [{ id: 1 }] }))
      .mockResolvedValueOnce(jsonResponse({ total: 2, page: 2, limit: 100, pops: [{ id: 2 }] }))
      .mockResolvedValueOnce(jsonResponse({ id: 3 }))
      .mockResolvedValueOnce(jsonResponse({ id: 3 }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }))
      .mockResolvedValueOnce(
        new Response(new Blob(["pdf"]), {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="pop.pdf"' },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listPops(1, "token")).resolves.toEqual([{ id: 1 }, { id: 2 }]);
    await createPop({ procedureId: 1, name: "POP", file: new File(["pdf"], "pop.pdf") }, "token");
    await updatePop(3, { procedureId: 1, name: "POP 2" }, "token");
    await deletePop(3, "token");
    const download = await downloadPop(3, "token");

    expect(download.filename).toBe("pop.pdf");
    await expect(createPop({ procedureId: 1, name: "Sem arquivo" }, "token")).rejects.toThrow(
      "Selecione um arquivo PDF.",
    );
    expect(fetchMock.mock.calls[2][1].body).toBeInstanceOf(FormData);
  });

  it("solicita, reenvia e confirma códigos de cadastro em etapas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestSignupCode({
        name: "Ana Souza",
        phone: "(11) 91234-5678",
        email: "ana@example.com",
      }),
    ).resolves.toEqual({ signup_id: "signup-1", expires_in: 300, resend_after: 90 });
    await expect(resendSignupCode("signup-1")).resolves.toEqual({
      signup_id: "signup-1",
      expires_in: 300,
      resend_after: 90,
    });
    await expect(verifySignupEmailCode("signup-1", "111111")).resolves.toEqual({
      signup_id: "signup-1",
      expires_in: 300,
      resend_after: 90,
    });
    await expect(resendSignupPhoneCode("signup-1")).resolves.toEqual({
      signup_id: "signup-1",
      expires_in: 300,
      resend_after: 90,
    });
    await verifySignupPhoneCode("signup-1", "222222");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/auth/signup/request-code",
      "/api/auth/signup/resend-code",
      "/api/auth/signup/verify-email-code",
      "/api/auth/signup/resend-phone-code",
      "/api/auth/signup/verify-phone-code",
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: "Ana Souza",
      phone_number: "11912345678",
      email: "ana@example.com",
    });
  });

  it("solicita e confirma troca de contato", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ expires_in: 300, resend_after: 90 }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ expires_in: 300, resend_after: 90 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestContactChange(7, "phone", "11999999999", "token")).resolves.toEqual({
      expires_in: 300,
      resend_after: 90,
    });
    await verifyContactChange(7, "email", "a@b.com", "123456", "token");
    await expect(requestEmailConfirmation(7, "token")).resolves.toEqual({
      expires_in: 300,
      resend_after: 90,
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/users/7/contact/request",
      "/api/users/7/contact/verify",
      "/api/users/7/contact/confirm-email/request",
    ]);
  });

  it("consulta, conecta, sincroniza e desconecta Google Calendar", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ connected: true, professional_id: 8, calendar_id: "cal" }),
      )
      .mockResolvedValueOnce(jsonResponse({ url: "https://google/connect" }))
      .mockResolvedValueOnce(jsonResponse({ connected: true, synced: 1, failed: 0 }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGoogleCalendarStatus("token")).resolves.toMatchObject({ connected: true });
    await expect(getGoogleCalendarConnectUrl("token")).resolves.toBe("https://google/connect");
    await expect(syncGoogleCalendar("token", 5)).resolves.toMatchObject({ synced: 1 });
    await disconnectGoogleCalendar("token");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["/api/google-calendar/status", "GET"],
      ["/api/google-calendar/connect", "GET"],
      ["/api/google-calendar/sync", "POST"],
      ["/api/google-calendar/disconnect", "DELETE"],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ schedule_id: 5 });
  });
});
