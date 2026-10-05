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

  const [overStage, setOverStage] = useState<ApplicationStage | null>(null);
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

  const handleDragOver = (e: React.DragEvent, stage: ApplicationStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, stage: ApplicationStage) => {
    e.preventDefault();
    setOverStage(null);
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
    return <div className="h-64 animate-pulse border-t border-line" />;
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
        <div className="bench border-l-2 border-caution px-4 py-3">
          <p className="condensed text-micro font-normal text-caution">
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
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={() => setOverStage((current) => (current === stage ? null : current))}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-normal text-ink">
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

              {/* Dala inner-page adaptation: columns have no box; a drag target is
                  marked by a thin violet top line. */}
              <div
                className={cx(
                  "flex min-h-[150px] flex-col gap-5 border-t pt-4 transition-colors",
                  overStage === stage ? "border-iris" : "border-line"
                )}
              >
                {stageApps.map((app) => {
                  const appReminders = remindersByApp.get(app.id);
                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="group relative cursor-grab active:cursor-grabbing"
                    >
                      <h3 className="font-normal text-ink transition-colors group-hover:text-saffron">
                        {app.roleTitle}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{app.companyName}</p>

                      {app.url ? (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block text-xs text-saffron hover:underline"
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
                                "text-xs",
                                rem.type === "no-response" ? "text-saffron" : "text-muted"
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
                    className="border-t border-line pt-4"
                  >
                    <div className="space-y-3">
                      <input
                        autoFocus
                        required
                        placeholder={t("companyName")}
                        className="field"
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                      />
                      <input
                        required
                        placeholder={t("roleTitle")}
                        className="field"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                      />
                      <input
                        type="url"
                        placeholder={t("url")}
                        className="field"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <button type="submit" className="text-xs font-normal text-saffron hover:underline">
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

