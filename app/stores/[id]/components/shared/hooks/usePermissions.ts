// app/hooks/usePermissions.ts
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UserPermissions {
  can_backdate: boolean;
  can_edit_price: boolean;
  can_edit_transaction: boolean;
  can_delete_transaction: boolean;
  can_manage_items: boolean;
  can_manage_categories: boolean;
  can_manage_customers: boolean;
  can_manage_expenses: boolean;
  can_manage_store: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  can_backdate: false,
  can_edit_price: false,
  can_edit_transaction: false,
  can_delete_transaction: false,
  can_manage_items: false,
  can_manage_categories: false,
  can_manage_customers: false,
  can_manage_expenses: false,
  can_manage_store: false,
};

import { decodeJwtPayload } from "@/app/stores/[id]/components/shared/lib/utils/jwt";

export function usePermissions(): UserPermissions {
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    const supabase = createClient();

    const extractPermissions = (payload: any): UserPermissions | null => {
      if (!payload) return null;
      
      const rawPerms = payload.app_metadata?.permissions || payload.user_metadata?.permissions || payload.permissions;

      if (!rawPerms) return null;

      let parsedPerms = rawPerms;
      if (typeof rawPerms === "string") {
        try { parsedPerms = JSON.parse(rawPerms); } 
        catch (e) { return null; }
      }

      if (parsedPerms && typeof parsedPerms === "object") {
        return { ...DEFAULT_PERMISSIONS, ...parsedPerms };
      }
      return null;
    };

    // 1. Read directly from the encoded JWT access token
    const fetchPermissionsFromToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const decoded = decodeJwtPayload(session.access_token);
        const perms = extractPermissions(decoded);
        if (perms) setPermissions(perms);
      }
    };

    fetchPermissionsFromToken();

    // 2. Listen for live token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        const decoded = decodeJwtPayload(session.access_token);
        const livePerms = extractPermissions(decoded);
        setPermissions(livePerms || DEFAULT_PERMISSIONS);
      } else {
        setPermissions(DEFAULT_PERMISSIONS);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return permissions;
}

export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  can_backdate: "Backdate Transactions",
  can_edit_price: "Edit Price During Sale",
  can_edit_transaction: "Edit Past Transactions",
  can_delete_transaction: "Delete / Void Transactions",
  can_manage_items: "Manage Inventory Items",
  can_manage_categories: "Manage Categories",
  can_manage_customers: "Manage Customers",
  can_manage_expenses: "Manage Expenses",
  can_manage_store: "Manage Store Identity",
};

export const PERMISSION_DESCRIPTIONS: Record<keyof UserPermissions, string> = {
  can_backdate: "Allows setting a custom date when recording a sale",
  can_edit_price: "Allows changing the unit price of items in the cart",
  can_edit_transaction: "Allows editing details on past transaction records",
  can_delete_transaction: "Allows voiding or deleting completed payments",
  can_manage_items: "Allows adding, editing, and deleting inventory items",
  can_manage_categories: "Allows creating and managing product categories",
  can_manage_customers: "Allows registering, editing, and deleting customers",
  can_manage_expenses: "Allows recording and deleting cash-out expenses",
  can_manage_store: "Allows updating store name, logo, and business details",
};
