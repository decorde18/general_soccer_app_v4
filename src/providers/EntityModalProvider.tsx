"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import LocationDetailsModal from "@/components/location/LocationDetailsModal";
import ClubDetailsModal from "@/components/club/ClubDetailsModal";

interface LocationModalState {
  isOpen: boolean;
  locationId: number | null;
  locationNameFallback?: string | null;
  sublocationName?: string | null;
}

interface ClubModalState {
  isOpen: boolean;
  clubId: number | null;
  clubNameFallback?: string | null;
}

interface EntityModalContextType {
  openLocationModal: (
    locationId: number | null,
    locationNameFallback?: string | null,
    sublocationName?: string | null
  ) => void;
  closeLocationModal: () => void;
  openClubModal: (
    clubId: number | null,
    clubNameFallback?: string | null
  ) => void;
  closeClubModal: () => void;
}

const EntityModalContext = createContext<EntityModalContextType | undefined>(undefined);

export function EntityModalProvider({ children }: { children: ReactNode }) {
  const [locationModal, setLocationModal] = useState<LocationModalState>({
    isOpen: false,
    locationId: null,
  });

  const [clubModal, setClubModal] = useState<ClubModalState>({
    isOpen: false,
    clubId: null,
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

  const openClubModal = (
    clubId: number | null,
    clubNameFallback?: string | null
  ) => {
    setClubModal({
      isOpen: true,
      clubId,
      clubNameFallback,
    });
  };

  const closeClubModal = () => {
    setClubModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <EntityModalContext.Provider
      value={{
        openLocationModal,
        closeLocationModal,
        openClubModal,
        closeClubModal,
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
      <ClubDetailsModal
        isOpen={clubModal.isOpen}
        onClose={closeClubModal}
        clubId={clubModal.clubId}
        clubNameFallback={clubModal.clubNameFallback}
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
