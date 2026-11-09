import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "../../test/fixtures";
import {
  logoutSession,
  requestLoginCode,
  requestRecoveryCode,
  verifyLoginCode,
  verifyRecoveryCode,
} from "./auth";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./categories";
import { requestContactChange, verifyContactChange } from "./contact-change";
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
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ access_token: "jwt" }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await requestLoginCode("(11) 91234-5678");
    await expect(verifyLoginCode("11912345678", "123456")).resolves.toBe("jwt");
    await requestRecoveryCode("a@b.com", "(11) 91234-5678");
    await verifyRecoveryCode("a@b.com", "11912345678", "654321");
    await logoutSession("jwt");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["/api/auth/request-code", "POST"],
      ["/api/auth/verify-code", "POST"],
      ["/api/auth/recovery/request-code", "POST"],
      ["/api/auth/recovery/verify-code", "POST"],
      ["/api/auth/logout", "POST"],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      phone_number: "11912345678",
    });
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

  it("solicita e confirma troca de contato", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await requestContactChange(7, "phone", "11999999999", "token");
    await verifyContactChange(7, "email", "a@b.com", "123456", "token");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/users/7/contact/request",
      "/api/users/7/contact/verify",
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
