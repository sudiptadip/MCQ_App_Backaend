import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  LogOut,
  Menu,
  X,
  User as UserIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { storage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";
import type { User } from "../features/auth/types";
import { useState, useEffect } from "react";
import SidebarMenu, { navItems } from "../components/layout/SidebarMenu";
import api from "../lib/axios";
import { API_ROUTES } from "../constants/apiRoute";
import { ThemeToggle } from "../components/common/ThemeToggle";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = storage.get<User>(STORAGE_KEYS.USER);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const [franchiseLogo, setFranchiseLogo] = useState<string | null>(storage.get<string>(STORAGE_KEYS.FRANCHISE_LOGO));
  const [franchiseName, setFranchiseName] = useState<string | null>(storage.get<string>(STORAGE_KEYS.FRANCHISE_NAME));

  // Helper to resolve relative URL using VITE_API_URL
  const getAbsoluteUrl = (url?: string | null): string => {
    if (!url) return "";
    const cleanUrl = url.trim().replace(/\\/g, "/");
    if (/^(https?:|data:)/i.test(cleanUrl)) {
      return cleanUrl;
    }
    let apiBase = (import.meta.env.VITE_API_URL || "").trim();
    // Remove trailing /api or /api/
    apiBase = apiBase.replace(/\/api\/?$/, "");
    // Ensure apiBase doesn't have a trailing slash
    apiBase = apiBase.replace(/\/$/, "");
    // Ensure cleanUrl has a leading slash if not present
    const slash = cleanUrl.startsWith("/") ? "" : "/";
    return `${apiBase}${slash}${cleanUrl}`;
  };

  useEffect(() => {
    const fetchFranchiseBranding = async () => {
      // Fetch only if user belongs to a franchise and we don't have stored values yet
      if (!user?.franchiseId) return;
      if (franchiseLogo || franchiseName) return;

      try {
        const response = await api.post(API_ROUTES.GET_FRANCHISE_LOGO_AND_NAME, {
          FranchiseId: Number(user.franchiseId)
        });

        if (response.data && response.data.isSuccess) {
          const resData = response.data.data;
          let rawLogo = "";
          let rawName = "";

          if (Array.isArray(resData) && resData.length > 0) {
            rawLogo = resData[0]?.logo_url || resData[0]?.LogoUrl || "";
            rawName = resData[0]?.franchise_name || resData[0]?.FranchiseName || "";
          } else if (resData) {
            rawLogo = resData.logo_url || resData.LogoUrl || "";
            rawName = resData.franchise_name || resData.FranchiseName || "";
          }

          if (rawLogo || rawName) {
            const absoluteLogo = getAbsoluteUrl(rawLogo);
            storage.set(STORAGE_KEYS.FRANCHISE_LOGO, absoluteLogo);
            storage.set(STORAGE_KEYS.FRANCHISE_NAME, rawName);
            setFranchiseLogo(absoluteLogo);
            setFranchiseName(rawName);
          }
        }
      } catch (error) {
        console.error("Failed to load franchise branding", error);
      }
    };

    fetchFranchiseBranding();
  }, [user?.franchiseId, franchiseLogo, franchiseName]);

  const handleLogout = () => {
    storage.remove(STORAGE_KEYS.TOKEN);
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.FRANCHISE_LOGO);
    storage.remove(STORAGE_KEYS.FRANCHISE_NAME);
    navigate("/login");
  };


  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Sidebar Backdrop (Mobile Only) */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? "fixed inset-y-0 left-0 z-50 shadow-2xl" : "relative"}
          ${isSidebarOpen ? "w-64 translate-x-0" : isMobile ? "w-64 -translate-x-full" : "w-20"}
          transition-all duration-300 bg-background border-r flex flex-col h-full
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0 bg-background">
          <div className="flex items-center gap-2 min-w-0">
            {franchiseLogo ? (
              <img 
                src={franchiseLogo} 
                alt="Logo" 
                className={`${
                  !isSidebarOpen && !isMobile 
                    ? "w-8 h-8 object-contain" 
                    : "h-9 max-w-[150px] object-contain"
                } hover:scale-105 transition-all duration-300`}
              />
            ) : (
              !isSidebarOpen && !isMobile ? (
                <BookOpen className="text-primary shrink-0" />
              ) : (
                <span className="font-bold text-sm text-primary uppercase tracking-wider truncate">
                  MCQ App
                </span>
              )
            )}
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </Button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto bg-background">
          <SidebarMenu isSidebarOpen={isSidebarOpen} isMobile={isMobile} />
        </nav>

        <div className="p-4 border-t bg-background shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {(isSidebarOpen || isMobile) && <span className="font-medium">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-background border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted rounded-full shrink-0"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle Menu"
            >
              <Menu size={20} />
            </Button>

            {/* Logo / Branding next to hamburger on mobile */}
            <div className="flex items-center gap-2 sm:hidden min-w-0">
              {franchiseLogo ? (
                <img 
                  src={franchiseLogo} 
                  alt="Logo" 
                  className="h-8 max-w-[130px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-1.5 font-bold text-sm text-primary uppercase tracking-wider truncate">
                  <BookOpen size={18} className="shrink-0 text-primary" />
                  <span className="truncate">MCQ App</span>
                </div>
              )}
            </div>

            <h2 className="font-semibold text-lg hidden sm:block truncate">
              {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none mb-1">{user?.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {franchiseName || user?.role || "Student"}
              </p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              <UserIcon size={20} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/20">
          <div className="mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;