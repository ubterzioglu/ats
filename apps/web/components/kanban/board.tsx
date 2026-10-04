"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type { ApplicationRecord, ApplicationStage } from "@/lib/store/schema";
import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication
} from "@/lib/applications/store";

const STAGES: readonly ApplicationStage[] = ["saved", "applied", "interview", "offer", "rejected"];

export function KanbanBoard() {
  const t = useTranslations("kanban");
  const [applications, setApplications] = useState<readonly ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick form state for "add new"
  const [addingToStage, setAddingToStage] = useState<ApplicationStage | null>(null);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const refresh = async () => {
    const list = await listApplications();
    if (list.ok) {
      setApplications(list.value);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

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

    // Optimistic update
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

  if (loading) {
    return <div className="animate-pulse h-64 bg-bench-sunk rounded-md" />;
  }

  return (
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
                className="text-muted hover:text-ink transition-colors"
                onClick={() => setAddingToStage(stage)}
                aria-label={t("add")}
              >
                +
              </button>
            </div>

            <div className="flex flex-col gap-3 min-h-[150px] rounded-lg bg-bench-sunk p-3">
              {stageApps.map((app) => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  className="group relative cursor-grab rounded-md border border-line bg-sheet p-4 shadow-sm active:cursor-grabbing"
                >
                  <h3 className="font-medium text-ink">{app.roleTitle}</h3>
                  <p className="mt-1 text-sm text-muted">{app.companyName}</p>
                  
                  {app.url && (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-xs text-signal hover:underline"
                    >
                      {new URL(app.url).hostname}
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(app.id)}
                    className="absolute right-3 top-3 hidden text-muted hover:text-danger group-hover:block"
                    aria-label={t("delete")}
                  >
                    ×
                  </button>
                </div>
              ))}

              {addingToStage === stage && (
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
                      <button type="submit" className="text-xs font-medium text-signal hover:underline">
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
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
