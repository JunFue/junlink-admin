"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  getUserStores, 
  sendCoAdminInvite, 
  syncCoAdminAccess,
  type Store 
} from "@/app/stores/services/storeService";
import { Shield, CheckSquare, Square, Save, Loader2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAdminProfiles } from "../actions";

interface AdminAccess {
  adminId: string;
  storeIds: Set<string>;
  userDetails?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export default function AccountAdminManager() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminAccess[]>([]);
  
  // Invite State
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStores, setInviteStores] = useState<Set<string>>(new Set());
  const [inviteLoading, setInviteLoading] = useState(false);

  // Sync State
  const [syncingAdminId, setSyncingAdminId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const userStores = await getUserStores(supabase, user.id);
      setStores(userStores);
      
      // Process stores to find unique co-admins and their access
      const adminMap = new Map<string, Set<string>>();
      
      userStores.forEach(store => {
        if (store.co_admins && Array.isArray(store.co_admins)) {
          store.co_admins.forEach(adminId => {
            if (!adminMap.has(adminId)) {
              adminMap.set(adminId, new Set());
            }
            adminMap.get(adminId)?.add(store.store_id);
          });
        }
      });

      const adminIds = Array.from(adminMap.keys());
      const adminDetailsMap = new Map<string, any>();
      
      if (adminIds.length > 0) {
        // Use server action to fetch co-admin details (bypassing RLS)
        const usersData = await getAdminProfiles(adminIds);
          
        if (usersData && usersData.length > 0) {
          usersData.forEach(u => adminDetailsMap.set(u.user_id, u));
        }
      }

      const adminList: AdminAccess[] = Array.from(adminMap.entries()).map(([adminId, storeIds]) => ({
        adminId,
        storeIds,
        userDetails: adminDetailsMap.get(adminId)
      }));
      
      setAdmins(adminList);
    }
    setLoading(false);
  };

  const toggleStoreAccess = (adminIndex: number, storeId: string) => {
    setAdmins(prev => {
      const newAdmins = [...prev];
      const admin = { ...newAdmins[adminIndex] };
      // Clone set
      admin.storeIds = new Set(admin.storeIds);
      
      if (admin.storeIds.has(storeId)) {
        admin.storeIds.delete(storeId);
      } else {
        admin.storeIds.add(storeId);
      }
      
      newAdmins[adminIndex] = admin;
      return newAdmins;
    });
  };

  const handleSync = async (admin: AdminAccess) => {
    if (!confirm(`Save access changes for admin ${admin.adminId}?`)) return;
    
    setSyncingAdminId(admin.adminId);
    try {
      const targetStoreIds = Array.from(admin.storeIds);
      const res = await syncCoAdminAccess(supabase, admin.adminId, targetStoreIds);
      
      if (res.success) {
        alert("Access updated successfully");
        router.refresh(); // Refresh page to maybe get new data if needed
      } else {
        alert("Failed to update access: " + res.message);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSyncingAdminId(null);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || inviteStores.size === 0) {
      alert("Please enter an email and select at least one store.");
      return;
    }

    setInviteLoading(true);
    try {
        const targetStoreIds = Array.from(inviteStores);
        const res = await sendCoAdminInvite(supabase, targetStoreIds, inviteEmail);
        
        if (res.success) {
            alert("Invite sent!");
            setShowInvite(false);
            setInviteEmail("");
            setInviteStores(new Set());
            // No need to refresh admin list yet as they are pending
        } else {
            alert("Error sending invite: " + res.message);
        }
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setInviteLoading(false);
    }
  }

  const toggleInviteStore = (storeId: string) => {
      setInviteStores(prev => {
          const newSet = new Set(prev);
          if (newSet.has(storeId)) newSet.delete(storeId);
          else newSet.add(storeId);
          return newSet;
      });
  }

  if (loading) {
    return (
        <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Manage Admins</h2>
          <button 
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-3 py-2 rounded-md text-primary-foreground text-sm font-medium"
          >
              <UserPlus className="w-4 h-4" />
              Add Admin
          </button>
      </div>

      {/* Invite Section */}
      {showInvite && (
          <div className="bg-muted/30 border-border p-4 border rounded-lg animate-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Invite New Administrator</h3>
                  <button onClick={() => setShowInvite(false)}><X className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-4">
                  <input 
                      type="email" 
                      placeholder="Admin Email Address"
                      className="w-full bg-background border-input px-3 py-2 border rounded-md"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  
                  <div>
                      <p className="mb-2 text-sm text-muted-foreground">Select Stores to Assign:</p>
                      <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                          {stores.map(store => (
                              <div 
                                key={store.store_id}
                                onClick={() => toggleInviteStore(store.store_id)}
                                className={`cursor-pointer p-2 rounded border text-sm flex items-center gap-2 ${inviteStores.has(store.store_id) ? 'bg-primary/10 border-primary' : 'bg-background border-input'}`}
                              >
                                  {inviteStores.has(store.store_id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                                  {store.store_name}
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="flex justify-end">
                      <button 
                        onClick={handleSendInvite}
                        disabled={inviteLoading}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 px-4 py-2 rounded-md text-primary-foreground text-sm font-medium"
                      >
                          {inviteLoading ? "Sending..." : "Send Invitations"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Admin Matrix */}
      <div className="space-y-4">
        {admins.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                No active co-admins found across your stores.
            </div>
        ) : (
            <div className="gap-4 grid">
                {admins.map((admin, idx) => (
                    <div key={admin.adminId} className="bg-card border-border p-4 border rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 flex justify-center items-center rounded-full w-10 h-10 font-medium text-indigo-600 dark:text-indigo-400 text-sm">
                                    {admin.userDetails?.first_name ? admin.userDetails.first_name[0].toUpperCase() : 'A'}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">
                                        {admin.userDetails?.first_name || admin.userDetails?.last_name 
                                            ? `${admin.userDetails.first_name || ''} ${admin.userDetails.last_name || ''}`.trim()
                                            : admin.userDetails?.email || admin.adminId}
                                    </p>
                                    {admin.userDetails?.email && (
                                        <p className="text-xs text-muted-foreground">{admin.userDetails.email}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5">Has access to {admin.storeIds.size} stores</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSync(admin)}
                                disabled={!!syncingAdminId}
                                className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-3 py-1.5 rounded text-xs transition-colors"
                            >
                                {syncingAdminId === admin.adminId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save Changes
                            </button>
                        </div>
                        
                        <div className="border-t pt-3">
                             <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Control</p>
                             <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {stores.map(store => {
                                    const hasAccess = admin.storeIds.has(store.store_id);
                                    return (
                                        <div 
                                            key={store.store_id}
                                            onClick={() => toggleStoreAccess(idx, store.store_id)}
                                            className={`
                                                cursor-pointer flex items-center gap-2 p-2 rounded text-sm transition-all
                                                ${hasAccess ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' : 'bg-muted/50 text-muted-foreground border border-transparent opacity-60 hover:opacity-100'}
                                            `}
                                        >
                                            {hasAccess ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            <span className="truncate">{store.store_name}</span>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
