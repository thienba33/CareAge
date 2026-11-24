import { createListCacheUpdater } from "../common";
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contactService, type ContactInput } from "../../services";
import type { EmergencyContact } from "../../types";
import { useSubject } from "../auth";
import { EMPTY_ARRAY } from "../../constants/common";
import { LOAD_ERROR_MESSAGE } from "../../constants/messages";
import { queryKeys } from "../../constants/queryKeys";
import { toErrorMessage } from "../../config/queryClient";

export function useEmergencyContacts() {
  const { subjectId } = useSubject();
  const queryClient = useQueryClient();
  const userId = subjectId ?? "";

  const query = useQuery({
    queryKey: queryKeys.emergencyContacts(userId),
    queryFn: () => contactService.getContacts(userId),
    enabled: !!subjectId,
  });

  const cache = useMemo(
    () => createListCacheUpdater<EmergencyContact>(queryClient, queryKeys.emergencyContacts(userId)),
    [queryClient, userId]
  );

  const addContact = useCallback(
    async (input: ContactInput) => {
      if (!subjectId) return;
      const contact = await contactService.addContact(subjectId, input);
      cache.add(contact);
    },
    [subjectId, cache]
  );

  const updateContact = useCallback(
    async (id: string, input: ContactInput) => {
      const updated = await contactService.updateContact(id, input);
      cache.update(id, updated);
    },
    [cache]
  );

  const deleteContact = useCallback(
    async (id: string) => {
      await contactService.deleteContact(id);
      cache.remove(id);
    },
    [cache]
  );

  return {
    contacts: query.data ?? EMPTY_ARRAY,
    isLoading: !!subjectId && query.isPending,
    error: toErrorMessage(query.error, LOAD_ERROR_MESSAGE),
    addContact,
    updateContact,
    deleteContact,
    reload: query.refetch,
  };
}
