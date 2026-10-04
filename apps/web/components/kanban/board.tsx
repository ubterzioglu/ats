"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { ApplicationRecord, ApplicationStage } from "@/lib/store/schema";
import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication
} from "@/lib/applications/store";
import {
  exportApplicationsToCSV,
  exportApplicationsToJSON,
  importApplicationsFromCSV,
  importApplicationsFromJSON
} from "@/lib/store/export";
import { generateReminders, type Reminder } from "@/lib/store/reminders";
import { cx } from "@/lib/ui";

const STAGES: readonly ApplicationStage[] = ["saved", "applied", "interview", "offer", "rejected"];

export function KanbanBoard() {
  const t = useTranslations("kanban");
  const [applications, setApplications] = useState<readonly ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addingToStage, setAddingToStage] = useState<ApplicationStage | null>(null);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const refresh = useCallback(async () => {
    const list = await listApplications();
    if (list.ok) {
      setApplications(list.value);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reminders = useMemo(
    () => generateReminders(applications),
    [applications]
  );

  const remindersByApp = useMemo(() => {
    const map = new Map<string, readonly Reminder[]>();
    for (const rem of reminders) {
      const existing = map.get(rem.application.id) ?? [];
      map.set(rem.application.id, [...existing, rem]);
    }
    return map;
  }, [reminders]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("applicationId", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stage: ApplicationStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("applicationId");
    if (!id) return;

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, stage } : app))
    );

    await updateApplication(id, { stage });
    refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingToStage || !newCompany || !newRole) return;

    await createApplication({
      id: crypto.randomUUID(),
      companyName: newCompany,
      roleTitle: newRole,
      stage: addingToStage,
      url: newUrl || undefined
    });

    setAddingToStage(null);
    setNewCompany("");
    setNewRole("");
    setNewUrl("");
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteApplication(id);
    refresh();
  };

  const handleExportJSON = useCallback(() => {
    const json = exportApplicationsToJSON(applications);
    downloadBlob(json, "applications.json", "application/json");
  }, [applications]);

  const handleExportCSV = useCallback(() => {
    const csv = exportApplicationsToCSV(applications);
    downloadBlob(csv, "applications.csv", "text/csv");
  }, [applications]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      const text = await file.text();
      let records: ApplicationRecord[];

      try {
        if (file.name.endsWith(".csv")) {
          records = importApplicationsFromCSV(text);
        } else {
          records = importApplicationsFromJSON(text);
        }
      } catch {
        return;
      }

      for (const record of records) {
        await createApplication({
          id: record.id || crypto.randomUUID(),
          companyName: record.companyName,
          roleTitle: record.roleTitle,
          stage: record.stage,
          url: record.url,
          jobId: record.jobId,
          variantId: record.variantId,
          scoreAtApplication: record.scoreAtApplication,
          notes: record.notes,
          contacts: record.contacts ? [...record.contacts] : undefined
        });
      }
      refresh();
    },
    [refresh]
  );

  if (loading) {
    return <div className="animate-pulse h-64 rounded-md bg-bench-sunk" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-quiet" onClick={handleExportJSON}>
          {t("exportJSON")}
        </button>
        <button type="button" className="btn-quiet" onClick={handleExportCSV}>
          {t("exportCSV")}
        </button>
        <button type="button" className="btn-quiet" onClick={handleImportClick}>
          {t("import")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {reminders.length > 0 ? (
        <div className="bench rounded-control border border-caution/30 bg-caution/[0.04] px-4 py-3">
          <p className="condensed text-micro font-medium text-caution">
            {t("remindersHeading")}
          </p>
          <ul className="mt-2 space-y-1">
            {reminders.slice(0, 5).map((rem) => (
              <li key={rem.id} className="text-sm text-caution">
                {rem.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:overflow-x-auto lg:pb-8">
        {STAGES.map((stage) => {
          const stageApps = applications.filter((a) => a.stage === stage);

          return (
            <div
              key={stage}
              className="flex-1 shrink-0 lg:w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink">
                  {t(`stages.${stage}`)}
                  <span className="ml-2 text-muted">{stageApps.length}</span>
                </h2>
                <button
                  type="button"
                  className="text-muted transition-colors hover:text-ink"
                  onClick={() => setAddingToStage(stage)}
                  aria-label={t("add")}
                >
                  +
                </button>
              </div>

              <div className="flex min-h-[150px] flex-col gap-3 rounded-lg bg-bench-sunk p-3">
                {stageApps.map((app) => {
                  const appReminders = remindersByApp.get(app.id);
                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="group relative cursor-grab rounded-md border border-line bg-sheet p-4 shadow-sm active:cursor-grabbing"
                    >
                      <h3 className="font-medium text-ink">{app.roleTitle}</h3>
                      <p className="mt-1 text-sm text-muted">{app.companyName}</p>

                      {app.url ? (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block text-xs text-action hover:underline"
                        >
                          {safeHostname(app.url)}
                        </a>
                      ) : null}

                      {appReminders ? (
                        <div className="mt-2 space-y-1">
                          {appReminders.map((rem) => (
                            <p
                              key={rem.id}
                              className={cx(
                                "rounded-chip px-2 py-0.5 text-xs",
                                rem.type === "no-response"
                                  ? "bg-caution/10 text-caution"
                                  : "bg-action/10 text-action"
                              )}
                            >
                              {rem.message}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDelete(app.id)}
                        className="absolute right-3 top-3 hidden text-muted transition-colors hover:text-mark group-hover:block"
                        aria-label={t("delete")}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {addingToStage === stage ? (
                  <form
                    onSubmit={handleCreate}
                    className="rounded-md border border-line bg-sheet p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <input
                        autoFocus
                        required
                        placeholder={t("companyName")}
                        className="w-full rounded bg-transparent text-sm text-ink outline-none"
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                      />
                      <input
                        required
                        placeholder={t("roleTitle")}
                        className="w-full rounded bg-transparent text-sm text-ink outline-none"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                      />
                      <input
                        type="url"
                        placeholder={t("url")}
                        className="w-full rounded bg-transparent text-sm text-ink outline-none"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <button type="submit" className="text-xs font-medium text-action hover:underline">
                          {t("save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingToStage(null)}
                          className="text-xs text-muted hover:text-ink"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
