"use client";

import React, { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Search, Edit2, Trash2, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { GenericForm } from "@/components/ui/GenericForm";
import { locationConfig } from "@/lib/entities/configs/location.config";
import { subLocationConfig } from "@/lib/entities/configs/subLocation.config";
import { createLocation, updateLocation, deleteLocation } from "@/lib/actions/location-actions";
import { createSubLocation, updateSubLocation, deleteSubLocation } from "@/lib/actions/sublocation-actions";
import { useSessionContext } from "@/contexts/SessionProvider";
import { getEffectiveRoles } from "@/lib/roles";
import type { Role } from "@/components/entities/types";

interface LocationRecord {
  id: number;
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

interface SubLocationRecord {
  id: number;
  name: string;
  locationId: number;
  locationName: string | null;
  surfaceType: string;
  capacity: number | null;
  description: string | null;
  isActive: boolean;
}

interface LocationsDashboardClientProps {
  initialLocations: LocationRecord[];
  initialSubLocations: SubLocationRecord[];
}

export default function LocationsDashboardClient({
  initialLocations,
  initialSubLocations,
}: LocationsDashboardClientProps) {
  // Roles & permissions
  const session = useSessionContext() as any;
  const activeRoles = useMemo<Role[]>(
    () => getEffectiveRoles(session?.user?.roles),
    [session]
  );
  
  const canAdmin = activeRoles.includes("ADMIN") || activeRoles.includes("CLUB_ADMIN");
  const canDelete = activeRoles.includes("ADMIN");

  // State data list
  const [locations, setLocations] = useState<LocationRecord[]>(initialLocations);
  const [subLocations, setSubLocations] = useState<SubLocationRecord[]>(initialSubLocations);

  // Filter & selections
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    initialLocations[0]?.id || null
  );

  // Form modals state
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editLocationRecord, setEditLocationRecord] = useState<LocationRecord | null>(null);

  const [showSubForm, setShowSubForm] = useState(false);
  const [editSubRecord, setEditSubRecord] = useState<SubLocationRecord | null>(null);

  // Delete modals state
  const [deleteLocationTarget, setDeleteLocationTarget] = useState<LocationRecord | null>(null);
  const [deleteSubTarget, setDeleteSubTarget] = useState<SubLocationRecord | null>(null);

  const [isPending, startTransition] = useTransition();

  // Selected Location object
  const selectedLocation = useMemo(() => {
    return locations.find((l) => l.id === selectedLocationId) || null;
  }, [selectedLocationId, locations]);

  // Filtered locations (left pane)
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locations, locationSearch]);

  // Sublocations belonging to selected location
  const activeSubLocations = useMemo(() => {
    if (!selectedLocationId) return [];
    return subLocations.filter((sub) => sub.locationId === selectedLocationId);
  }, [subLocations, selectedLocationId]);

  // subLocationConfig dynamic options
  const populatedSubConfig = useMemo(() => {
    const configCopy = { ...subLocationConfig };
    const locFieldIndex = configCopy.form.fields.findIndex((f) => f.key === "locationName");
    if (locFieldIndex !== -1) {
      configCopy.form.fields[locFieldIndex].options = locations.map((loc) => ({
        label: loc.name,
        value: String(loc.id),
      }));
    }
    return configCopy;
  }, [locations]);

  // --- Location CRUD actions ---
  const handleLocationSubmit = async (formData: Record<string, string>) => {
    startTransition(async () => {
      try {
        if (editLocationRecord) {
          await updateLocation(editLocationRecord.id, formData);
          setLocations((prev) =>
            prev.map((l) =>
              l.id === editLocationRecord.id
                ? { ...l, name: formData.name, addressLine1: formData.addressLine1, addressLine2: formData.addressLine2, city: formData.city, state: formData.state, postalCode: formData.postalCode }
                : l
            )
          );
          toast.success("Location updated successfully");
        } else {
          const newLoc = await createLocation(formData);
          setLocations((prev) => [...prev, {
            id: newLoc.id,
            name: formData.name,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2 || null,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country || "USA"
          }]);
          setSelectedLocationId(newLoc.id);
          toast.success("Location created successfully");
        }
        setShowLocationForm(false);
        setEditLocationRecord(null);
      } catch (err: any) {
        toast.error(err.message || "Action failed");
      }
    });
  };

  const handleLocationDelete = async () => {
    if (!deleteLocationTarget) return;
    startTransition(async () => {
      try {
        await deleteLocation(deleteLocationTarget.id);
        setLocations((prev) => prev.filter((l) => l.id !== deleteLocationTarget.id));
        setSubLocations((prev) => prev.filter((sub) => sub.locationId !== deleteLocationTarget.id));
        
        // Select another location if current was deleted
        if (selectedLocationId === deleteLocationTarget.id) {
          const remaining = locations.filter((l) => l.id !== deleteLocationTarget.id);
          setSelectedLocationId(remaining[0]?.id || null);
        }
        toast.success("Location deleted successfully");
        setDeleteLocationTarget(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete location");
      }
    });
  };

  // --- Sub-location CRUD actions ---
  const handleSubSubmit = async (formData: Record<string, string>) => {
    // Map value key
    const targetLocId = Number(formData.locationId);
    const targetLocName = locations.find((l) => l.id === targetLocId)?.name || "";

    startTransition(async () => {
      try {
        if (editSubRecord) {
          await updateSubLocation(editSubRecord.id, formData);
          setSubLocations((prev) =>
            prev.map((sub) =>
              sub.id === editSubRecord.id
                ? {
                    ...sub,
                    name: formData.name,
                    locationId: targetLocId,
                    locationName: targetLocName,
                    surfaceType: formData.surfaceType || "grass",
                    capacity: formData.capacity ? Number(formData.capacity) : null,
                    description: formData.description || null,
                    isActive: formData.isActive === "true",
                  }
                : sub
            )
          );
          toast.success("Pitch updated successfully");
        } else {
          const newSub = await createSubLocation(formData);
          setSubLocations((prev) => [
            ...prev,
            {
              id: newSub.id,
              name: formData.name,
              locationId: targetLocId,
              locationName: targetLocName,
              surfaceType: formData.surfaceType || "grass",
              capacity: formData.capacity ? Number(formData.capacity) : null,
              description: formData.description || null,
              isActive: formData.isActive === "true",
            },
          ]);
          toast.success("Pitch added successfully");
        }
        setShowSubForm(false);
        setEditSubRecord(null);
      } catch (err: any) {
        toast.error(err.message || "Action failed");
      }
    });
  };

  const handleSubDelete = async () => {
    if (!deleteSubTarget) return;
    startTransition(async () => {
      try {
        await deleteSubLocation(deleteSubTarget.id);
        setSubLocations((prev) => prev.filter((sub) => sub.id !== deleteSubTarget.id));
        toast.success("Pitch deleted successfully");
        setDeleteSubTarget(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete sub-location");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Locations & Fields</h1>
          <p className="text-muted text-sm mt-1">
            Configure athletic locations, map physical complex address layouts, and add specific playing fields.
          </p>
        </div>
        {canAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setEditLocationRecord(null);
              setShowLocationForm(true);
            }}
            className="flex items-center gap-1.5 font-bold text-xs py-2 px-4 shadow-sm"
          >
            <Plus size={14} />
            <span>Add Complex</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LOCATIONS LIST (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
          <h3 className="font-bold text-xs text-text uppercase tracking-wider">
            Field Complexes ({locations.length})
          </h3>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search complex name..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-text placeholder:text-muted/60"
            />
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-1">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted">No locations found.</div>
            ) : (
              filteredLocations.map((loc) => {
                const isSelected = loc.id === selectedLocationId;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary/25 shadow-sm font-bold text-primary"
                        : "bg-background/40 hover:bg-background/70 border-border/40 hover:border-border/80 text-text"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs truncate block">{loc.name}</span>
                      <span className="text-[10px] text-muted font-normal block truncate">
                        {loc.city ? `${loc.city}, ${loc.state || ""}` : "No address mapped"}
                      </span>
                    </div>

                    {canAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0 opacity-70 hover:opacity-100 pl-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditLocationRecord(loc);
                            setShowLocationForm(true);
                          }}
                          className="p-1 hover:bg-primary/10 text-muted hover:text-primary rounded"
                        >
                          <Edit2 size={12} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteLocationTarget(loc);
                            }}
                            className="p-1 hover:bg-danger/10 text-muted hover:text-danger rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LOCATION PITCH DETAILS & SUB-CRUD (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLocation ? (
            <div className="bg-surface border border-border/80 rounded-2xl p-5 shadow-sm space-y-6">
              {/* Complex details box */}
              <div className="flex items-start justify-between border-b border-border/45 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin size={18} />
                    <h2 className="font-extrabold text-xl text-text leading-none">
                      {selectedLocation.name}
                    </h2>
                  </div>
                  <p className="text-xs text-muted font-medium pl-6">
                    {selectedLocation.addressLine1}
                    {selectedLocation.addressLine2 ? `, ${selectedLocation.addressLine2}` : ""}{" "}
                    {selectedLocation.city ? `• ${selectedLocation.city}, ${selectedLocation.state || ""} ${selectedLocation.postalCode || ""}` : ""}
                  </p>
                </div>
              </div>

              {/* Sub-locations (playing fields) box */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-text uppercase tracking-wider">
                    Playing Fields / Pitches ({activeSubLocations.length})
                  </h3>
                  {canAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditSubRecord(null);
                        setShowSubForm(true);
                      }}
                      className="flex items-center gap-1 font-bold text-[10px] py-1.5 px-3 rounded-lg"
                    >
                      <Plus size={12} />
                      <span>Add Pitch</span>
                    </Button>
                  )}
                </div>

                {activeSubLocations.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted bg-background/20 border border-dashed border-border rounded-xl">
                    No fields are configured for this complex yet. Click &quot;Add Pitch&quot; to configure ones.
                  </div>
                ) : (
                  <div className="border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/50 bg-background/15">
                    {activeSubLocations.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex justify-between items-center p-3.5 hover:bg-background/25 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-text block truncate">{sub.name}</span>
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-border text-muted">
                              {sub.surfaceType}
                            </span>
                          </div>
                          {sub.capacity && (
                            <span className="text-[10px] text-muted block mt-0.5">
                              Capacity: {sub.capacity} spectators
                            </span>
                          )}
                          {sub.description && (
                            <span className="text-[10px] text-muted/80 block italic mt-0.5">
                              {sub.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Active badge */}
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            {sub.isActive ? (
                              <span className="text-success flex items-center gap-1">
                                <CheckCircle size={12} /> Active
                              </span>
                            ) : (
                              <span className="text-muted flex items-center gap-1">
                                <XCircle size={12} /> Inactive
                              </span>
                            )}
                          </div>

                          {/* Action icons */}
                          {canAdmin && (
                            <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
                              <button
                                onClick={() => {
                                  setEditSubRecord(sub);
                                  setShowSubForm(true);
                                }}
                                className="p-1 hover:bg-primary/10 text-muted hover:text-primary rounded transition-colors"
                              >
                                <Edit2 size={12} />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => setDeleteSubTarget(sub)}
                                  className="p-1 hover:bg-danger/10 text-muted hover:text-danger rounded transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface/30 border border-dashed border-border rounded-2xl py-24 text-center text-xs text-muted">
              Select a complex from the left panel to review location layouts and manage pitches.
            </div>
          )}
        </div>
      </div>

      {/* --- FORM MODALS --- */}
      {/* Location Form */}
      {showLocationForm && (
        <GenericForm
          config={locationConfig}
          initialData={editLocationRecord as any}
          onSubmit={handleLocationSubmit as any}
          onCancel={() => {
            setShowLocationForm(false);
            setEditLocationRecord(null);
          }}
        />
      )}

      {/* Sub-location Form */}
      {showSubForm && (
        <GenericForm
          config={populatedSubConfig}
          initialData={
            (editSubRecord || {
              locationId: String(selectedLocationId),
              locationName: selectedLocation?.name || "",
              isActive: "true",
            }) as any
          }
          onSubmit={handleSubSubmit as any}
          onCancel={() => {
            setShowSubForm(false);
            setEditSubRecord(null);
          }}
        />
      )}

      {/* --- DELETE CONFIRMS --- */}
      <Dialog
        isOpen={!!deleteLocationTarget}
        onClose={() => setDeleteLocationTarget(null)}
        title="Delete Field Complex"
        message={`Are you sure you want to delete ${deleteLocationTarget?.name || ""}? All child playing fields will also be deleted. This cannot be undone.`}
        type="error"
        confirmText="Delete Complex"
        cancelText="Cancel"
        onConfirm={handleLocationDelete}
      />

      <Dialog
        isOpen={!!deleteSubTarget}
        onClose={() => setDeleteSubTarget(null)}
        title="Delete Playing Field"
        message={`Are you sure you want to delete ${deleteSubTarget?.name || ""}? Any matches assigned to this pitch will lose their field mapping. This cannot be undone.`}
        type="error"
        confirmText="Delete Field"
        cancelText="Cancel"
        onConfirm={handleSubDelete}
      />
    </div>
  );
}
