import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/providers": "Providers",
  "/bookings": "Bookings",
  "/payments": "Payments",
  "/payouts": "Payouts",
  "/subscriptions": "Subscriptions",
  "/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/providers/")) return "Provider Detail";
  return "BookMe Admin";
}

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">
          {resolveTitle(location.pathname)}
        </h1>
      </div>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user?.email?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-slate-900">
              {user?.email}
            </p>
            <p className="flex items-center gap-1 text-xs leading-tight text-slate-500">
              <ShieldCheck className="h-3 w-3" />
              {user?.role}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-44 animate-fade-in rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
