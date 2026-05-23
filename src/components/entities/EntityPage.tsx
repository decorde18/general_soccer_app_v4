"use client";

import { useState, useMemo } from "react";

import { type EntityConfig, type Role } from "@/components/entities/types";
import { getEffectiveRoles } from "@/lib/roles";
import { Plus, Search, AlertCircle } from "lucide-react";
import { GenericTable } from "../ui/GenericTable";
import { GenericForm } from "../ui/GenericForm";
import { useToast } from "@/components/ui/toast";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useSessionContext } from "@/contexts/SessionProvider";

interface EntityPageProps<T extends Record<string, unknown>> {
  config: EntityConfig;
  data: T[];

  onCreate: (data: Record<string, string>) => Promise<void>;
  onUpdate: (id: unknown, data: Record<string, string>) => Promise<void>;
  onDelete: (id: unknown) => Promise<void>;
  stats?: { label: string; value: number | string }[];
}

export function EntityPage<T extends Record<string, unknown>>({
  config,
  data: initialData,

  onCreate,
  onUpdate,
  onDelete,
  stats,
}: EntityPageProps<T>) {
  type SessionWithRoles = {
    user?: {
      roles?: Record<string, unknown>;
    };
  } | null;

  const session = useSessionContext() as SessionWithRoles;
  const activeRoles = useMemo<Role[]>(
    () => getEffectiveRoles(session?.user?.roles),
    [session],
  );
  const [data, setData] = useState<T[]>(initialData);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const { toast } = useToast();

  const canCreate = config.permissions.create.some((role) =>
    activeRoles.includes(role),
  );
  const canEdit = config.permissions.edit.some((role) =>
    activeRoles.includes(role),
  );
  const canDelete = config.permissions.delete.some((role) =>
    activeRoles.includes(role),
  );
  const canView = config.permissions.view.some((role) =>
    activeRoles.includes(role),
  );

  const statusCol = config.table.columns.find((c) => c.type === "badge");
  const statusOptions = statusCol?.options
    ? Object.keys(statusCol.options)
    : [];

  const filteredData = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter(
      (row) => row[statusCol?.key ?? "status"] === statusFilter,
    );
  }, [data, statusFilter, statusCol]);

  const handleCreate = async (formData: Record<string, string>) => {
    try {
      await onCreate(formData);
      setData((prev) => [
        ...prev,
        { ...formData, id: Date.now() } as unknown as T,
      ]);
      setShowForm(false);
      toast({
        title: "Success",
        description: `${config.singular} created successfully`,
        type: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: `Failed to create ${config.singular.toLowerCase()}`,
        type: "error",
      });
    }
  };

  const handleUpdate = async (formData: Record<string, string>) => {
    if (!editRecord) return;
    const id = (editRecord as Record<string, unknown>).id;
    try {
      await onUpdate(id, formData);
      setData((prev) =>
        prev.map((row) =>
          (row as Record<string, unknown>).id === id
            ? { ...row, ...formData }
            : row,
        ),
      );
      setEditRecord(null);
      setShowForm(false);
      toast({
        title: "Success",
        description: `${config.singular} updated successfully`,
        type: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: `Failed to update ${config.singular.toLowerCase()}`,
        type: "error",
      });
    }
  };

  const handleDelete = async (row: T | null) => {
    if (!row) return;
    const id = (row as Record<string, unknown>).id;
    setDeleteError(null);
    try {
      await onDelete(id);
      setData((prev) =>
        prev.filter((r) => (r as Record<string, unknown>).id !== id),
      );
      toast({
        title: "Success",
        description: `${config.singular} deleted successfully`,
        type: "success",
      });
    } catch {
      setDeleteError(`Failed to delete ${config.singular}. Please try again.`);
      toast({
        title: "Error",
        description: `Failed to delete ${config.singular.toLowerCase()}`,
        type: "error",
      });
    }
  };

  const openEdit = (row: T) => {
    setEditRecord(row);
    setShowForm(true);
  };

  if (!canView) {
    return (
      <div className='flex items-center gap-2 text-sm text-warning-text bg-warning-bg border border-warning-border rounded-lg px-4 py-3'>
        <AlertCircle size={16} />
        You don&apos;t have permission to view this page.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-xl font-medium text-text'>{config.title}</h1>
          <p className='text-sm text-muted mt-0.5'>
            Manage all{" "}
            {config.plural?.toLowerCase() ?? config.title.toLowerCase()}
          </p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            onClick={() => {
              setEditRecord(null);
              setShowForm(true);
            }}
            className='flex-row items-center gap-2 font-medium px-4 py-2 text-sm'
            size="md"
          >
            <Plus size={15} />
            Add {config.singular}
          </Button>
        )}
      </div>

      {/* Permission warning (read-only roles) */}
      {!canCreate && !canEdit && (
        <div className='flex items-center gap-2 text-sm text-warning-text bg-warning-bg border border-warning-border rounded-lg px-4 py-3'>
          <AlertCircle size={15} />
          You have read-only access to this section.
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className='flex items-center gap-2 text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-4 py-3'>
          <AlertCircle size={15} />
          {deleteError}
        </div>
      )}

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {stats.map((s) => (
            <div key={s.label} className='bg-background rounded-lg px-4 py-3'>
              <p className='text-xs text-muted mb-1'>{s.label}</p>
              <p className='text-xl font-medium text-text'>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className='bg-surface border border-border rounded-xl overflow-hidden'>
        {/* Toolbar */}
        <div className='flex items-center gap-3 px-4 py-3 border-b border-border'>
          <div className='relative flex-1 max-w-xs'>
            <Search
              size={14}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-muted/60'
            />
            <input
              type='text'
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={`Search ${config.plural?.toLowerCase() ?? config.title.toLowerCase()}...`}
              className='w-full pl-8 pr-3 py-2 text-sm border border-border rounded-xl bg-surface text-text placeholder:text-muted/60 focus:outline-none focus:border-border focus:ring-2 focus:ring-primary/10 transition-colors'
            />
          </div>

          {statusOptions.length > 0 && (
            <Select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All statuses" },
                ...statusOptions.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
              ]}
              showPlaceholder={false}
              className="min-w-[140px]"
            />
          )}

          <span className='ml-auto text-xs text-muted'>
            {filteredData.length}{" "}
            {filteredData.length === 1
              ? config.singular.toLowerCase()
              : (config.plural?.toLowerCase() ?? config.title.toLowerCase())}
          </span>
        </div>

        <GenericTable
          data={filteredData}
          columns={config.table.columns}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={(row: T) => {
            setDeleteTarget(row);
            setDeleteDialogOpen(true);
          }}
          globalFilter={globalFilter}
        />
      </div>

      {/* Modal form */}
      {showForm && (
        <GenericForm
          config={config}
          initialData={editRecord}
          onSubmit={editRecord ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditRecord(null);
          }}
        />
      )}

      <Dialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={`Delete ${config.singular}`}
        message={`Are you sure you want to delete this ${config.singular.toLowerCase()}? This action cannot be undone.`}
        type='error'
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={async () => {
          await handleDelete(deleteTarget);
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
