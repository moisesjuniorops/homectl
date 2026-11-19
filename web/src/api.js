import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

// Chamadas relativas (/api/...): o mesmo build funciona em dev (proxy do Vite) e em produção.
async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = typeof data.detail === "string" ? data.detail : "Dados inválidos";
    } catch {
      /* sem corpo */
    }
    throw new Error(detail);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  list: (r) => request("GET", `/${r}`),
  create: (r, d) => request("POST", `/${r}`, d),
  update: (r, id, d) => request("PATCH", `/${r}/${id}`, d),
  remove: (r, id) => request("DELETE", `/${r}/${id}`),
  action: (p) => request("POST", p),
  summary: () => request("GET", "/summary"),
};

export const notifyError = (e) => notifications.show({ color: "red", title: "Ops!", message: e.message });
export const notifyOk = (message) => notifications.show({ color: "teal", message, autoClose: 2500 });

/** Carrega uma coleção da API e expõe ações que já recarregam e avisam erros. */
export function useResource(resource) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setRows(await api.list(resource));
    } catch (e) {
      notifyError(e);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = (fn, ok) => async (...args) => {
    try {
      await fn(...args);
      if (ok) notifyOk(ok);
      await reload();
    } catch (e) {
      notifyError(e);
    }
  };

  return {
    rows,
    loading,
    reload,
    create: run((d) => api.create(resource, d), "Adicionado!"),
    patch: run((id, d) => api.update(resource, id, d)),
    remove: run((id) => api.remove(resource, id), "Removido"),
    run,
  };
}

export const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (d) => (d ? dayjs(d).format("DD MMM") : "—");
export const today = () => dayjs().format("YYYY-MM-DD");
export const daysUntil = (d) => dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");
