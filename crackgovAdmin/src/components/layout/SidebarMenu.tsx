import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  ContactRound,
  ListChevronsDownUp,
  ClipboardCheck,
  Monitor,
  GraduationCap,
  History,
  HelpCircle,
  Trophy,
  FileText,
  IndianRupee,
  BriefcaseBusiness,
  Newspaper,
  CalendarDays,
  MessageSquareQuote,
  Mail,
  Sparkles,
  Layers,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  GraduationCap as StudentCap,
  Globe2,
  ShieldAlert
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ROLES, STORAGE_KEYS } from "../../constants";
import { storage } from "../../utils/storage";
import type { User } from "../../features/auth/types";

const { SUPER_ADMIN, STUDENT, FRANCHISE_ADMIN } = ROLES;

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  roles: string[];
  badge?: string;
}

export interface NavCategory {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: NavItem[];
}

export const navCategories: NavCategory[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        icon: <LayoutDashboard size={18} />,
        label: "Dashboard",
        path: "/",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT],
      },
    ],
  },
  {
    id: "academics",
    title: "Questions & Academics",
    icon: <BookOpen size={14} />,
    items: [
      {
        icon: <BookOpen size={18} />,
        label: "Questions & Answers",
        path: "/question-ans",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
      {
        icon: <ShieldAlert size={18} className="text-rose-500" />,
        label: "Advance Delete",
        path: "/question-ans/advanced-delete",
        roles: [SUPER_ADMIN],
        badge: "Admin",
      },
      {
        icon: <ListChevronsDownUp size={18} />,
        label: "Category Management",
        path: "/category",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
      {
        icon: <ClipboardCheck size={18} />,
        label: "Tests & Exams",
        path: "/test",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
      {
        icon: <FileText size={18} />,
        label: "Study Material",
        path: "/study-material",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
      {
        icon: <Monitor size={18} />,
        label: "Display Views",
        path: "/display-view",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
    ],
  },
  {
    id: "student_portal",
    title: "Student Portal & Practice",
    icon: <StudentCap size={14} />,
    items: [
      {
        icon: <GraduationCap size={18} />,
        label: "Practice Arena",
        path: "/practice",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT],
      },
      {
        icon: <FileText size={18} />,
        label: "Study Notes",
        path: "/notes",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT],
      },
      {
        icon: <Monitor size={18} />,
        label: "Video Classes",
        path: "/videos",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT],
      },
      {
        icon: <Trophy size={18} />,
        label: "Leaderboard",
        path: "/leaderboard",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT],
      },
      {
        icon: <History size={18} />,
        label: "Exam History",
        path: "/practice/history",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT],
      },
      {
        icon: <IndianRupee size={18} />,
        label: "My Fees & Dues",
        path: "/my-fees",
        roles: [STUDENT],
      },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: <FolderKanban size={14} />,
    items: [
      {
        icon: <ContactRound size={18} />,
        label: "Franchise Management",
        path: "/franchise",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <Users size={18} />,
        label: "Student Accounts",
        path: "/student",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
      {
        icon: <IndianRupee size={18} />,
        label: "Fees Management",
        path: "/fees",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
      {
        icon: <Mail size={18} />,
        label: "Email Templates",
        path: "/email-templates",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
    ],
  },
  {
    id: "website_cms",
    title: "Website & Content CMS",
    icon: <Globe2 size={14} />,
    items: [
      {
        icon: <Sparkles size={18} />,
        label: "Hero Banner",
        path: "/hero",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <Layers size={18} />,
        label: "Exam Categories",
        path: "/exam-categories",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <BriefcaseBusiness size={18} />,
        label: "Job Posts",
        path: "/jobs",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <Newspaper size={18} />,
        label: "Blog Posts",
        path: "/blogs",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <CalendarDays size={18} />,
        label: "Daily Current Affairs",
        path: "/current-affairs",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <HelpCircle size={18} />,
        label: "FAQs Management",
        path: "/faqs",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <MessageSquareQuote size={18} />,
        label: "Testimonials",
        path: "/testimonials",
        roles: [SUPER_ADMIN],
      },
      {
        icon: <Mail size={18} />,
        label: "Contact Inquiries",
        path: "/contact-inquiries",
        roles: [SUPER_ADMIN],
      },
    ],
  },
  {
    id: "system",
    title: "System & Support",
    items: [
      {
        icon: <HelpCircle size={18} />,
        label: "Help Guide",
        path: "/help",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN],
      },
      {
        icon: <Settings size={18} />,
        label: "Settings",
        path: "/settings",
        roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT],
      },
    ],
  },
];

// Backward-compatible flat array export
export const navItems = navCategories.flatMap((c) => c.items);

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  isMobile: boolean;
}

const SidebarMenu = ({ isSidebarOpen, isMobile }: SidebarMenuProps) => {
  const location = useLocation();
  const user = storage.get<User>(STORAGE_KEYS.USER);
  const userRole = user?.role || STUDENT;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Collapsed categories state (all expanded by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Filter categories by user role and search query
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return navCategories
      .map((cat) => {
        // Filter items by role
        const roleItems = cat.items.filter((item) => item.roles.includes(userRole));

        // Filter items by search query if present
        const matchedItems = query
          ? roleItems.filter((item) => item.label.toLowerCase().includes(query))
          : roleItems;

        return {
          ...cat,
          items: matchedItems,
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [userRole, searchQuery]);

  const showFullMenu = isSidebarOpen || isMobile;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Search Bar (visible when sidebar is expanded) */}
      {showFullMenu && (
        <div className="px-1 pt-1 pb-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-input bg-muted/40 hover:bg-muted/70 focus:bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-muted-foreground" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Menu Categories */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-6 px-2 text-xs text-muted-foreground">
            No menu items found for "{searchQuery}"
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isCollapsed = !searchQuery && (collapsedCategories[category.id] ?? false);

            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                {showFullMenu && category.title && (
                  <div
                    onClick={() => !searchQuery && toggleCategory(category.id)}
                    className={`flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 rounded-md transition-colors select-none ${
                      !searchQuery ? "hover:text-foreground hover:bg-muted/30 cursor-pointer" : ""
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {category.icon}
                      {category.title}
                    </span>
                    {!searchQuery && (
                      <span className="text-muted-foreground/60 shrink-0">
                        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      </span>
                    )}
                  </div>
                )}

                {/* Divider for collapsed icon-only sidebar */}
                {!showFullMenu && (
                  <div className="my-2 border-t border-border/60 mx-1" />
                )}

                {/* Category Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {category.items.map((item) => {
                      const isActive = (() => {
                        if (item.path === "/") return location.pathname === "/";
                        if (location.pathname === item.path) return true;
                        const isSubRoute = location.pathname.startsWith(item.path + "/");
                        if (!isSubRoute) return false;
                        const hasMoreSpecific = navItems.some(
                          (other) =>
                            other.path !== item.path &&
                            other.path.length > item.path.length &&
                            (location.pathname === other.path ||
                              location.pathname.startsWith(other.path + "/"))
                        );
                        return !hasMoreSpecific;
                      })();

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={!showFullMenu ? item.label : undefined}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative
                            ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }
                          `}
                        >
                          <span className={`shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                            {item.icon}
                          </span>

                          {showFullMenu && (
                            <span className="truncate flex-1">{item.label}</span>
                          )}

                          {showFullMenu && item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wide shrink-0 ${
                                isActive
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SidebarMenu;
