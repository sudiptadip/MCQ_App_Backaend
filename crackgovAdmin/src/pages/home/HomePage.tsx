import React from 'react';
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { storage } from "../../utils/storage";
import type { User } from "../../features/auth/types";
import { ROLES, STORAGE_KEYS } from "../../constants";
import { getAdminDashboardStats, getStudentDashboardStats } from "../../features/dashboard/api/dashboard.api";
import { getFeesDashboard } from "../../features/fees/api/fees.api";
import {
   Trophy,
   Target,
   History,
   ChevronRight,
   GraduationCap,
   Clock,
   CheckCircle2,
   LayoutDashboard,
   Activity,
   Users,
   ClipboardCheck,
   TrendingUp,
   UserPlus,
   FileEdit,
   Loader2,
   RefreshCw,
   BookMarked,
   Layers,
   IndianRupee,
   AlertTriangle
} from "lucide-react";
import { Button } from "../../components/ui/button";

const formatTimeAgo = (dateString?: string) => {
   if (!dateString) return 'Just now';
   const date = new Date(dateString);
   if (isNaN(date.getTime())) return 'Recently';
   const now = new Date();
   const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

   if (diffSeconds < 60) return 'Just now';
   if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
   if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
   if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
   return date.toLocaleDateString();
};

const HomePage: React.FC = () => {
   const navigate = useNavigate();
   const user = storage.get<User>(STORAGE_KEYS.USER) || ({} as User);
   const isStudent = user.role === ROLES.STUDENT;

   const {
      data: adminStats,
      isLoading: loadingAdmin,
      refetch: refetchAdmin,
      isRefetching: refetchingAdmin
   } = useQuery({
      queryKey: ['adminDashboardStats'],
      queryFn: getAdminDashboardStats,
      enabled: !isStudent,
      staleTime: 1000 * 30,
   });

   const {
      data: feesStats,
      isLoading: loadingFees,
   } = useQuery({
      queryKey: ['feesDashboard'],
      queryFn: getFeesDashboard,
      enabled: !isStudent,
      staleTime: 1000 * 30,
   });

   const {
      data: studentStats,
      isLoading: loadingStudent,
      refetch: refetchStudent,
      isRefetching: refetchingStudent
   } = useQuery({
      queryKey: ['studentDashboardStats'],
      queryFn: getStudentDashboardStats,
      enabled: isStudent,
      staleTime: 1000 * 30,
   });

   if (isStudent) {
      const attemptsCount = studentStats?.total_attempts ?? 0;
      const successRate = studentStats?.success_rate ?? 0;
      const accuracy = studentStats?.accuracy_percentage ?? 0;
      const practiceMins = studentStats?.practice_time_minutes ?? 0;
      const practiceHoursText = practiceMins > 60
         ? `${Math.floor(practiceMins / 60)}h ${practiceMins % 60}m`
         : `${practiceMins}m`;

      return (
         <div className="space-y-10 animate-in fade-in duration-700">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <GraduationCap size={160} />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-zinc-800/50 backdrop-blur-md border border-white/30 dark:border-zinc-700/50 text-[10px] font-bold uppercase tracking-widest">
                        <Trophy size={14} className="text-yellow-300" /> Student Dashboard
                     </div>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetchStudent()}
                        disabled={loadingStudent || refetchingStudent}
                        className="text-white hover:bg-white/20 rounded-full h-8 px-3 gap-1.5 text-xs font-bold"
                     >
                        <RefreshCw size={14} className={refetchingStudent || loadingStudent ? "animate-spin" : ""} /> Sync
                     </Button>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                     Welcome back, <span className="text-indigo-200 dark:text-emerald-400">{user.name?.split(' ')[0] || "Scholar"}</span>!
                  </h1>
                  <p className="text-indigo-100/80 dark:text-zinc-300 text-lg max-w-xl font-medium">
                     Ready to level up your skills? Pick up where you left off or start a new practice session today.
                  </p>
                  <div className="pt-4">
                     <Button
                        onClick={() => navigate('/practice')}
                        className="rounded-2xl h-14 px-8 bg-white dark:bg-emerald-600 text-indigo-600 dark:text-white hover:bg-indigo-50 dark:hover:bg-emerald-500 font-black text-lg shadow-xl dark:shadow-none shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95"
                     >
                        Start Practice <ChevronRight className="ml-2" />
                     </Button>
                  </div>
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                     <History size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Attempts</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                     {loadingStudent ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : attemptsCount}
                  </p>
               </div>

               <div className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                     <CheckCircle2 size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Success Rate</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                     {loadingStudent ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : `${successRate}%`}
                  </p>
               </div>

               <div className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                     <Clock size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Practice Time</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                     {loadingStudent ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : practiceHoursText}
                  </p>
               </div>

               <div className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                     <Target size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Accuracy</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                     {loadingStudent ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : `${accuracy}%`}
                  </p>
               </div>
            </div>

            {/* Quick Links / Recent Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 space-y-6">
                  <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-3">
                     <Activity className="text-indigo-600 dark:text-indigo-400" /> Recent Performance
                  </h3>
                  {loadingStudent ? (
                     <div className="bg-card rounded-[2.5rem] border border-border p-12 text-center flex flex-col items-center justify-center min-h-[250px]">
                        <Loader2 size={36} className="animate-spin text-primary mb-3" />
                        <p className="text-muted-foreground font-medium">Syncing student performance data...</p>
                     </div>
                  ) : studentStats?.recent_attempts && studentStats.recent_attempts.length > 0 ? (
                     <div className="bg-card rounded-[2.5rem] border border-border shadow-md dark:shadow-none p-6 space-y-4">
                        {studentStats.recent_attempts.map((item, idx) => (
                           <div key={item.attempt_id || idx} className="flex items-center justify-between p-4 rounded-2xl bg-accent/30 hover:bg-accent/60 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                                    <BookMarked size={20} />
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-900 dark:text-zinc-50">{item.test_name}</p>
                                    <p className="text-xs text-muted-foreground">{formatTimeAgo(item.started_at)}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="font-black text-lg text-primary">{item.score} pts</p>
                                 <p className="text-xs text-muted-foreground">{item.total_questions ? `${item.total_questions} Questions` : 'Completed'}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="bg-card rounded-[2.5rem] border border-border shadow-md dark:shadow-none p-12 text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-center text-slate-200 dark:text-zinc-600 mx-auto mb-6">
                           <History size={40} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-zinc-100">No recent activity</h4>
                        <p className="text-slate-500 dark:text-zinc-400 mt-2">Your latest practice results will appear here once you complete a test.</p>
                        <Button variant="outline" className="mt-6 rounded-xl font-bold border-border" onClick={() => navigate('/practice')}>Start Your First Test</Button>
                     </div>
                  )}
               </div>

               <div className="lg:col-span-4 space-y-6">
                  <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-3">
                     <LayoutDashboard className="text-indigo-600 dark:text-indigo-400" size={20} /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                     <button
                        onClick={() => navigate('/practice/history')}
                        className="flex items-center gap-4 p-5 rounded-3xl bg-card border border-border shadow-md dark:shadow-none hover:shadow-lg transition-all hover:-translate-x-1 text-left group"
                     >
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                           <History size={20} />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800 dark:text-zinc-100">View History</p>
                           <p className="text-xs text-slate-500 dark:text-zinc-400">Track your progress over time</p>
                        </div>
                     </button>

                     <button
                        onClick={() => navigate('/practice')}
                        className="flex items-center gap-4 p-5 rounded-3xl bg-card border border-border shadow-md dark:shadow-none hover:shadow-lg transition-all hover:-translate-x-1 text-left group"
                     >
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                           <GraduationCap size={20} />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800 dark:text-zinc-100">Browse Subjects</p>
                           <p className="text-xs text-slate-500 dark:text-zinc-400">Explore practice modules</p>
                        </div>
                     </button>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   // Admin / Franchise Dashboard (Dynamic View)
   const getActivityIcon = (type: string) => {
      if (type === 'student_registered') return { icon: <UserPlus className="text-blue-500" size={18} />, bg: 'bg-blue-50 dark:bg-blue-950/20' };
      if (type === 'test_created') return { icon: <FileEdit className="text-purple-500" size={18} />, bg: 'bg-purple-50 dark:bg-purple-950/20' };
      if (type === 'test_attempted') return { icon: <CheckCircle2 className="text-emerald-500" size={18} />, bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
      return { icon: <Activity className="text-indigo-500" size={18} />, bg: 'bg-indigo-50 dark:bg-indigo-950/20' };
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-700">
         {/* Admin Header */}
         <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <TrendingUp size={160} />
            </div>
            <div className="relative z-10 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                     <LayoutDashboard size={14} className="text-emerald-400" /> Admin Workspace
                  </div>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => refetchAdmin()}
                     disabled={loadingAdmin || refetchingAdmin}
                     className="text-white hover:bg-white/10 rounded-full h-8 px-3 gap-1.5 text-xs font-bold"
                  >
                     <RefreshCw size={14} className={refetchingAdmin || loadingAdmin ? "animate-spin" : ""} /> Sync Data
                  </Button>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                  Welcome back, <span className="text-emerald-400">{user.name?.split(' ')[0] || "Admin"}</span>
               </h1>
               <p className="text-slate-300 text-lg max-w-xl font-medium">
                  Here is a live overview of {user.franchiseName || "your organization"}'s performance and recent system activities.
               </p>
            </div>
         </div>

         {/* Stats Overview */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1">
               <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                     <Users size={24} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                     Live <TrendingUp size={12} className="ml-1" />
                  </span>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Students</p>
               <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                  {loadingAdmin ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : adminStats?.total_students?.toLocaleString() ?? 0}
               </p>
            </div>

            <div
                onClick={() => navigate('/fees')}
                className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
             >
                <div className="flex justify-between items-start mb-4">
                   <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <IndianRupee size={24} />
                   </div>
                   <span className="flex items-center text-xs font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                      Revenue <TrendingUp size={12} className="ml-1" />
                   </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fees Collected</p>
                <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                   {loadingFees ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : `₹${feesStats?.total_collected?.toLocaleString() ?? 0}`}
                </p>
             </div>

             <div
                onClick={() => navigate('/fees')}
                className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
             >
                <div className="flex justify-between items-start mb-4">
                   <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                      <AlertTriangle size={24} />
                   </div>
                   <span className="flex items-center text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg">
                      Due
                   </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Fee Dues</p>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400">
                   {loadingFees ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : `₹${feesStats?.total_due?.toLocaleString() ?? 0}`}
                </p>
             </div>

            <div className="group bg-card p-6 rounded-[2rem] border border-border shadow-md dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1">
               <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                     <Activity size={24} />
                  </div>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Attempts</p>
               <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                  {loadingAdmin ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : adminStats?.total_attempts?.toLocaleString() ?? 0}
               </p>
            </div>
         </div>

         {/* Admin Quick Actions & Recent Activity */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-3">
                  <Activity className="text-indigo-600 dark:text-indigo-400" size={20} /> System Activity
               </h3>
               <div className="bg-card rounded-[2rem] border border-border shadow-md dark:shadow-none p-6">
                  {loadingAdmin ? (
                     <div className="flex flex-col items-center justify-center p-12 text-center">
                        <Loader2 size={36} className="animate-spin text-primary mb-3" />
                        <p className="text-muted-foreground font-medium">Fetching real-time system activities...</p>
                     </div>
                  ) : adminStats?.recent_activities && adminStats.recent_activities.length > 0 ? (
                     <div className="space-y-6">
                        {adminStats.recent_activities.map((item, i) => {
                           const iconStyle = getActivityIcon(item.type);
                           return (
                              <div key={i} className="flex items-start gap-4">
                                 <div className={`h-10 w-10 rounded-full ${iconStyle.bg} flex items-center justify-center shrink-0`}>
                                    {iconStyle.icon}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">{item.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400 truncate">{item.description}</p>
                                 </div>
                                 <div className="text-xs font-medium text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                                    {formatTimeAgo(item.timestamp)}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="p-12 text-center text-muted-foreground">
                        <Layers size={36} className="mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-foreground/70">No recent system events</p>
                        <p className="text-xs mt-1 opacity-70">Activities will be logged dynamically as users interact with the system.</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center gap-3">
                  <LayoutDashboard className="text-indigo-600 dark:text-indigo-400" size={20} /> Management
               </h3>
               <div className="grid grid-cols-1 gap-4">
                  <button onClick={() => navigate('/question-ans/upload')} className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-md dark:shadow-none hover:shadow-lg transition-all hover:-translate-x-1 text-left group">
                     <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileEdit size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-slate-800 dark:text-zinc-100">Upload Questions</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">Bulk import via Excel</p>
                     </div>
                  </button>

                  <button onClick={() => navigate('/student')} className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-md dark:shadow-none hover:shadow-lg transition-all hover:-translate-x-1 text-left group">
                     <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Users size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-slate-800 dark:text-zinc-100">Manage Students</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">View and edit users</p>
                     </div>
                  </button>

                  <button onClick={() => navigate('/test')} className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-md dark:shadow-none hover:shadow-lg transition-all hover:-translate-x-1 text-left group">
                     <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <ClipboardCheck size={20} />
                      </div>
                     <div>
                        <p className="font-bold text-slate-800 dark:text-zinc-100">Manage Tests</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">Create & publish tests</p>
                     </div>
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default HomePage;
