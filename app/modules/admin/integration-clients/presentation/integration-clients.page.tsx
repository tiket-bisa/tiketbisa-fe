import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import {
  generateClientKey,
  normalizeClientCode,
  type IntegrationClient,
} from "../domain/integration-client";
import { integrationClientApi } from "../infrastructure/integration-client.api";

const textareaClass = "w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-button-disabled disabled:text-text-tertiary";

function toLocalDateTime(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string | null): string {
  if (!value) return "Tanpa batas";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function isPemPublicKey(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("-----BEGIN PUBLIC KEY-----") && trimmed.endsWith("-----END PUBLIC KEY-----");
}

export default function IntegrationClientsPage() {
  const [selectedId, setSelectedId] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createKey, setCreateKey] = useState("");
  const [editName, setEditName] = useState("");
  const [pem, setPem] = useState("");
  const [validFrom, setValidFrom] = useState(() => toLocalDateTime());
  const [validUntil, setValidUntil] = useState("");

  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useApiQuery(async () => {
    const response = await integrationClientApi.list();
    if (!response.success) throw new Error(response.error || "Gagal memuat integration clients.");
    return response.data;
  }, []);

  const selectedClient = useMemo(
    () => (clients ?? []).find((client) => client.id === selectedId) ?? null,
    [clients, selectedId],
  );

  const {
    data: keys,
    loading: keysLoading,
    error: keysError,
    refetch: refetchKeys,
  } = useApiQuery(async () => {
    if (!selectedId) return [];
    const response = await integrationClientApi.listKeys(selectedId);
    if (!response.success) throw new Error(response.error || "Gagal memuat RSA public keys.");
    return response.data;
  }, [selectedId]);

  useEffect(() => {
    if (!clients?.length) {
      setSelectedId("");
      return;
    }
    if (!selectedId) setSelectedId(clients[0].id);
  }, [clients, selectedId]);

  useEffect(() => {
    setEditName(selectedClient?.name ?? "");
  }, [selectedClient?.id, selectedClient?.name]);

  const clearMessage = () => {
    setPageError(null);
    setPageSuccess(null);
  };

  const copyText = async (value: string, label: string) => {
    clearMessage();
    try {
      await navigator.clipboard.writeText(value);
      setPageSuccess(`${label} berhasil disalin.`);
    } catch {
      setPageError(`Gagal menyalin ${label.toLowerCase()}.`);
    }
  };

  const handleGenerateClientKey = () => {
    const code = normalizeClientCode(createCode);
    if (!code) {
      setPageError("Isi client code sebelum membuat client key.");
      return;
    }
    clearMessage();
    setCreateCode(code);
    setCreateKey(generateClientKey(code));
  };

  const handleCreate = async () => {
    clearMessage();
    const code = normalizeClientCode(createCode);
    const name = createName.trim();
    const clientKey = createKey || (code ? generateClientKey(code) : "");
    if (!code || !name || !clientKey) {
      setPageError("Client code, nama, dan client key wajib diisi.");
      return;
    }
    setIsMutating(true);
    try {
      const response = await integrationClientApi.create({ code, name, client_key: clientKey });
      if (!response.success) {
        setPageError(response.error || "Gagal membuat integration client.");
        return;
      }
      setCreateCode(""); setCreateName(""); setCreateKey("");
      if (response.data?.id) setSelectedId(response.data.id);
      setPageSuccess("Integration client berhasil dibuat.");
      refetchClients();
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateName = async () => {
    if (!selectedClient || !editName.trim()) return;
    clearMessage(); setIsMutating(true);
    try {
      const response = await integrationClientApi.update(selectedClient.id, editName.trim());
      if (!response.success) return setPageError(response.error || "Gagal memperbarui nama client.");
      setPageSuccess("Nama client berhasil diperbarui."); refetchClients();
    } finally {
      setIsMutating(false);
    }
  };

  const handleClientStatus = async (client: IntegrationClient) => {
    const nextActive = !client.active;
    if (!nextActive && !window.confirm(`Nonaktifkan integration client ${client.name}?`)) return;
    clearMessage(); setIsMutating(true);
    try {
      const response = await integrationClientApi.updateStatus(client.id, nextActive);
      if (!response.success) return setPageError(response.error || "Gagal memperbarui status client.");
      setPageSuccess(`Client berhasil ${nextActive ? "diaktifkan" : "dinonaktifkan"}.`); refetchClients();
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddKey = async () => {
    if (!selectedClient) return;
    clearMessage();
    if (!isPemPublicKey(pem)) {
      setPageError("Public key harus menggunakan format PEM BEGIN/END PUBLIC KEY.");
      return;
    }
    const fromDate = new Date(validFrom);
    const untilDate = validUntil ? new Date(validUntil) : null;
    if (Number.isNaN(fromDate.getTime()) || (untilDate && Number.isNaN(untilDate.getTime()))) {
      setPageError("Validity window tidak valid.");
      return;
    }
    if (untilDate && untilDate <= fromDate) {
      setPageError("Valid until harus lebih besar dari valid from.");
      return;
    }
    setIsMutating(true);
    try {
      const response = await integrationClientApi.addKey(selectedClient.id, {
        public_key_pem: pem.trim(),
        valid_from: fromDate.toISOString(),
        valid_until: untilDate?.toISOString() ?? null,
      });
      if (!response.success) return setPageError(response.error || "Gagal menambahkan public key.");
      setPem(""); setValidFrom(toLocalDateTime()); setValidUntil("");
      setPageSuccess("RSA public key berhasil ditambahkan."); refetchKeys(); refetchClients();
    } finally {
      setIsMutating(false);
    }
  };

  const handleKeyStatus = async (keyId: string, active: boolean) => {
    if (!selectedClient) return;
    const nextActive = !active;
    if (!nextActive && !window.confirm("Nonaktifkan RSA public key ini?")) return;
    clearMessage(); setIsMutating(true);
    try {
      const response = await integrationClientApi.updateKeyStatus(selectedClient.id, keyId, nextActive);
      if (!response.success) return setPageError(response.error || "Gagal memperbarui status key.");
      setPageSuccess(`Public key berhasil ${nextActive ? "diaktifkan" : "dinonaktifkan"}.`);
      refetchKeys(); refetchClients();
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Integration Clients</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Kelola client yang dapat mengirim ticket order melalui API integrasi TiketBisa.
        </p>
      </div>

      {(pageError || clientsError) && <p className="rounded-lg bg-destructive-bg p-3 text-sm text-destructive-text">{pageError || clientsError}</p>}
      {pageSuccess && <p className="rounded-lg bg-success-bg p-3 text-sm text-success-text">{pageSuccess}</p>}

      <Card padding="lg">
        <h2 className="text-lg font-semibold text-text-primary">Tambah client</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Client code" placeholder="BETANG" value={createCode} disabled={isMutating}
            onChange={(event) => { setCreateCode(event.target.value); setCreateKey(""); }}
            onBlur={() => setCreateCode(normalizeClientCode(createCode))} />
          <Input label="Nama client" placeholder="Bank Kalteng Betang" value={createName} disabled={isMutating}
            onChange={(event) => setCreateName(event.target.value)} />
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <Input label="Client key" value={createKey} readOnly placeholder="Generate client key" className="font-mono md:min-w-[420px]" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleGenerateClientKey} disabled={isMutating}>Generate ulang</Button>
            <Button onClick={handleCreate} isLoading={isMutating}>Buat client</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.7fr)]">
        <Card padding="none">
          <div className="border-b border-border-default p-4">
            <h2 className="font-semibold text-text-primary">Daftar client</h2>
            <p className="text-xs text-text-tertiary">{clients?.length ?? 0} client terdaftar</p>
          </div>
          <div className="divide-y divide-border-subtle">
            {clientsLoading && <p className="p-4 text-sm text-text-tertiary">Memuat client...</p>}
            {!clientsLoading && !clients?.length && <p className="p-4 text-sm text-text-tertiary">Belum ada integration client.</p>}
            {(clients ?? []).map((client) => (
              <button key={client.id} type="button" onClick={() => setSelectedId(client.id)}
                className={`w-full p-4 text-left transition-colors hover:bg-surface-hover ${selectedId === client.id ? "bg-brand-primary-subtle" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-medium text-text-primary">{client.name}</p><p className="text-xs text-text-tertiary">{client.code}</p></div>
                  <Badge variant={client.active ? "success" : "destructive"}>{client.active ? "Aktif" : "Nonaktif"}</Badge>
                </div>
                <p className="mt-2 text-xs text-text-secondary">{client.activeKeyCount} active key</p>
              </button>
            ))}
          </div>
        </Card>

        {!selectedClient ? (
          <Card padding="lg"><p className="text-sm text-text-tertiary">Pilih client untuk melihat detail.</p></Card>
        ) : (
          <div className="space-y-6">
            <Card padding="lg">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-text-primary">{selectedClient.name}</h2><p className="text-sm text-text-tertiary">{selectedClient.code}</p></div>
                <Button variant={selectedClient.active ? "destructive" : "secondary"} size="sm" disabled={isMutating}
                  onClick={() => handleClientStatus(selectedClient)}>{selectedClient.active ? "Nonaktifkan" : "Aktifkan"}</Button>
              </div>
              <div className="mt-4 rounded-lg bg-surface-primary p-3">
                <p className="text-xs text-text-tertiary">Client key</p>
                <div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-sm text-text-primary">{selectedClient.clientKey}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyText(selectedClient.clientKey, "Client key")}>Salin</Button></div>
              </div>
              <div className="mt-4 flex gap-2"><Input label="Nama client" value={editName} disabled={isMutating}
                onChange={(event) => setEditName(event.target.value)} className="min-w-[240px]" />
                <Button variant="secondary" className="self-end" disabled={isMutating || !editName.trim() || editName.trim() === selectedClient.name}
                  onClick={handleUpdateName}>Simpan nama</Button></div>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary">Tambah RSA public key</h2>
              <div className="mt-4 space-y-4">
                <div><label htmlFor="public-key-pem" className="text-sm font-medium text-text-primary">Public key PEM</label>
                  <textarea id="public-key-pem" rows={7} value={pem} disabled={isMutating} onChange={(event) => setPem(event.target.value)}
                    placeholder={"-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"} className={`${textareaClass} mt-1.5`} /></div>
                <div className="grid gap-4 md:grid-cols-2"><Input type="datetime-local" label="Valid from" value={validFrom} disabled={isMutating}
                  onChange={(event) => setValidFrom(event.target.value)} /><Input type="datetime-local" label="Valid until (opsional)" value={validUntil} disabled={isMutating}
                  onChange={(event) => setValidUntil(event.target.value)} /></div>
                <Button onClick={handleAddKey} isLoading={isMutating}>Tambahkan public key</Button>
              </div>
            </Card>

            <Card padding="none">
              <div className="border-b border-border-default p-4"><h2 className="font-semibold text-text-primary">RSA public keys</h2></div>
              {keysLoading && <p className="p-4 text-sm text-text-tertiary">Memuat public keys...</p>}
              {keysError && <p className="p-4 text-sm text-destructive-text">{keysError}</p>}
              {!keysLoading && !keys?.length && <p className="p-4 text-sm text-text-tertiary">Belum ada public key.</p>}
              <div className="divide-y divide-border-subtle">{(keys ?? []).map((key) => (
                <div key={key.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><Badge variant={key.active ? "success" : "destructive"}>{key.active ? "Aktif" : "Nonaktif"}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => copyText(key.fingerprint, "Fingerprint")}>Salin fingerprint</Button></div>
                    <code className="mt-2 block break-all text-xs text-text-secondary">{key.fingerprint}</code>
                    <p className="mt-2 text-xs text-text-tertiary">{formatDate(key.validFrom)} — {formatDate(key.validUntil)}</p>
                  </div><Button variant={key.active ? "destructive" : "secondary"} size="sm" disabled={isMutating}
                    onClick={() => handleKeyStatus(key.id, key.active)}>{key.active ? "Nonaktifkan" : "Aktifkan"}</Button></div>
                </div>
              ))}</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
