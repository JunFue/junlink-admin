"use client";

import React from "react";
import { Lock, Settings, LogOut, ArrowRight, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SubscriptionRequiredPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -right-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-8 md:p-12 rounded-3xl shadow-2xl z-10 w-full max-w-lg text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 text-blue-500 flex items-center justify-center rounded-2xl mb-8 shadow-inner border border-zinc-700/50 relative">
          <ShieldAlert className="w-10 h-10" />
          <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-2 border-zinc-900">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
          Admin Access Locked
        </h1>
        
        <p className="text-zinc-400 mb-8 leading-relaxed max-w-md">
          The Junlink POS Admin Dashboard is a premium feature. Your store is currently on the Free Tier and requires an active subscription to access backoffice capabilities.
        </p>

        <div className="flex flex-col w-full gap-4">
          <a
            href={process.env.NEXT_PUBLIC_POS_URL ? `${process.env.NEXT_PUBLIC_POS_URL}/settings` : "#"}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            <Settings className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors" />
            Upgrade in POS Settings
            <ArrowRight className="w-4 h-4 opacity-50 ml-1 group-hover:translate-x-1 transition-transform" />
          </a>
          
          <button
            onClick={handleSignOut}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700 active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4 opacity-70" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
