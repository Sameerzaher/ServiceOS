"use client";

import { useEffect } from "react";

import { useToast } from "@/components/ui";
import { heUi } from "@/config";
import {
  ensureStorageBootstrap,
  getLastStorageBootstrapResult,
} from "@/core/persistence";

/**
 * Runs storage bootstrap once and surfaces a friendly error when the on-disk schema is unsupported.
 */
export function StorageBootstrapNotifier(): null {
  const toast = useToast();

  useEffect(() => {
    ensureStorageBootstrap();
    const r = getLastStorageBootstrapResult();
    if (r && !r.ok) {
      toast(heUi.toast.storageSchemaReset, "error");
    }
  }, [toast]);

  return null;
}
