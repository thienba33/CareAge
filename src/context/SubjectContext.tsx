import { useAuth } from "../hooks";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { caregiverService, staffService } from "../services";
import { queryKeys } from "../constants/queryKeys";
import type { FollowedElderly } from "../types/caregiver";

type Subject = { id: string; name: string };

type SubjectContextValue = {
  subjectId: string | null;
  subject: Subject | null;
  isSelf: boolean;
  linkedElderly: FollowedElderly[];
  isLoadingLinks: boolean;
  reloadLinks: () => Promise<unknown>;
  select: (elderlyId: string) => void;
};

const EMPTY: FollowedElderly[] = [];
const STORAGE_KEY = "careage.selectedElderlyId";

function readStoredSelection(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeSelection(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Không lưu được thì lần sau chọn người đầu tiên — không ảnh hưởng chức năng.
  }
}

export const SubjectContext = createContext<SubjectContextValue | undefined>(undefined);

export function SubjectProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const isCaregiver = currentUser?.role === "CAREGIVER";
  const isStaff = currentUser?.role === "MEDICAL_STAFF";
  // Người theo dõi người khác (chọn được người đang xem).
  const isFollower = isCaregiver || isStaff;
  const [selectedId, setSelectedId] = useState<string | null>(() => readStoredSelection());

  const linksQuery = useQuery<FollowedElderly[]>({
    queryKey: isStaff
      ? queryKeys.assignedPatients(currentUser?.id ?? "")
      : queryKeys.linkedElderly(currentUser?.id ?? ""),
    queryFn: () =>
      isStaff ? staffService.getAssignedPatients(currentUser!.id) : caregiverService.getLinkedElderly(currentUser!.id),
    enabled: isFollower,
  });
  const linkedElderly = linksQuery.data ?? EMPTY;

  // Lựa chọn đã lưu không còn hợp lệ (bị gỡ liên kết, đổi tài khoản) → chọn người đầu tiên.
  useEffect(() => {
    if (!isFollower || linkedElderly.length === 0) return;
    if (!selectedId || !linkedElderly.some((e) => e.id === selectedId)) {
      setSelectedId(linkedElderly[0].id);
    }
  }, [isFollower, linkedElderly, selectedId]);

  const select = useCallback((elderlyId: string) => {
    setSelectedId(elderlyId);
    storeSelection(elderlyId);
  }, []);

  const value = useMemo<SubjectContextValue>(() => {
    if (currentUser?.role === "ELDERLY") {
      return {
        subjectId: currentUser.id,
        subject: { id: currentUser.id, name: currentUser.name },
        isSelf: true,
        linkedElderly: EMPTY,
        isLoadingLinks: false,
        reloadLinks: async () => undefined,
        select: () => {},
      };
    }

    const selected = isFollower ? linkedElderly.find((e) => e.id === selectedId) ?? null : null;
    return {
      subjectId: selected?.id ?? null,
      subject: selected ? { id: selected.id, name: selected.name } : null,
      isSelf: false,
      linkedElderly,
      isLoadingLinks: isFollower && linksQuery.isPending,
      reloadLinks: linksQuery.refetch,
      select,
    };
  }, [currentUser, isFollower, linkedElderly, selectedId, linksQuery.isPending, linksQuery.refetch, select]);

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
}
