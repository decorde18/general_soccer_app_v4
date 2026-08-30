"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import LocationDetailsModal from "@/components/location/LocationDetailsModal";

interface LocationModalState {
  isOpen: boolean;
  locationId: number | null;
  locationNameFallback?: string | null;
  sublocationName?: string | null;
}

interface EntityModalContextType {
  openLocationModal: (
    locationId: number | null,
    locationNameFallback?: string | null,
    sublocationName?: string | null
  ) => void;
  closeLocationModal: () => void;
}

const EntityModalContext = createContext<EntityModalContextType | undefined>(undefined);

export function EntityModalProvider({ children }: { children: ReactNode }) {
  const [locationModal, setLocationModal] = useState<LocationModalState>({
    isOpen: false,
    locationId: null,
  });

  const openLocationModal = (
    locationId: number | null,
    locationNameFallback?: string | null,
    sublocationName?: string | null
  ) => {
    setLocationModal({
      isOpen: true,
      locationId,
      locationNameFallback,
      sublocationName,
    });
  };

  const closeLocationModal = () => {
    setLocationModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <EntityModalContext.Provider
      value={{
        openLocationModal,
        closeLocationModal,
      }}
    >
      {children}
      <LocationDetailsModal
        isOpen={locationModal.isOpen}
        onClose={closeLocationModal}
        locationId={locationModal.locationId}
        locationNameFallback={locationModal.locationNameFallback}
        sublocationName={locationModal.sublocationName}
      />
    </EntityModalContext.Provider>
  );
}

export function useEntityModal() {
  const context = useContext(EntityModalContext);
  if (!context) {
    throw new Error("useEntityModal must be used within an EntityModalProvider");
  }
  return context;
}
