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
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ROLES, STORAGE_KEYS } from "../../constants";
import { storage } from "../../utils/storage";
import type { User } from "../../features/auth/types";

const { SUPER_ADMIN, STUDENT, FRANCHISE_ADMIN } = ROLES;

// Define the nav items outside the component
export const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/", roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT] },
  { icon: <ContactRound size={20} />, label: "Franchise", path: "/franchise", roles: [SUPER_ADMIN] },
  { icon: <Users size={20} />, label: "Student", path: "/student", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <IndianRupee size={20} />, label: "Fees Management", path: "/fees", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <IndianRupee size={20} />, label: "My Fees & Dues", path: "/my-fees", roles: [STUDENT] },
  { icon: <ListChevronsDownUp size={20} />, label: "Category", path: "/category", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <BookOpen size={20} />, label: "Questions & Answers", path: "/question-ans", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <FileText size={20} />, label: "Study Material", path: "/study-material", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <BriefcaseBusiness size={20} />, label: "Job Posts", path: "/jobs", roles: [SUPER_ADMIN] },
  { icon: <Newspaper size={20} />, label: "Blog Posts", path: "/blogs", roles: [SUPER_ADMIN] },
  { icon: <CalendarDays size={20} />, label: "Daily Current Affairs", path: "/current-affairs", roles: [SUPER_ADMIN] },
  { icon: <ClipboardCheck size={20} />, label: "Tests", path: "/test", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <Monitor size={20} />, label: "Display Views", path: "/display-view", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <GraduationCap size={20} />, label: "Practice", path: "/practice", roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT] },
  { icon: <FileText size={20} />, label: "Notes", path: "/notes", roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT] },
  { icon: <Monitor size={20} />, label: "Videos", path: "/videos", roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT] },
  { icon: <Trophy size={20} />, label: "Leaderboard", path: "/leaderboard", roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT] },
  { icon: <History size={20} />, label: "History", path: "/practice/history", roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT] },
  { icon: <HelpCircle size={20} />, label: "Help Guide", path: "/help", roles: [SUPER_ADMIN, FRANCHISE_ADMIN] },
  { icon: <Settings size={20} />, label: "Settings", path: "/settings", roles: [SUPER_ADMIN, FRANCHISE_ADMIN, STUDENT] },
];

interface SidebarMenuProps {
  isSidebarOpen: boolean;
  isMobile: boolean;
}

const SidebarMenu = ({ isSidebarOpen, isMobile }: SidebarMenuProps) => {
  const location = useLocation();
  const user = storage.get<User>(STORAGE_KEYS.USER);
  const userRole = user?.role || STUDENT;

  const filteredItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {filteredItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className={`
            flex items-center gap-3 p-3 rounded-xl transition-all duration-200
            ${location.pathname === item.path
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
        >
          {item.icon}
          {(isSidebarOpen || isMobile) && (
            <span className="font-medium whitespace-nowrap">{item.label}</span>
          )}
        </Link>
      ))}
    </>
  );
};

export default SidebarMenu;
