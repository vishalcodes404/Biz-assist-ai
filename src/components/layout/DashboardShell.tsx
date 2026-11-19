"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  CheckCheck,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  Sparkles,
  Ticket as TicketIcon,
  Users,
  X,
} from "lucide-react";
import { getDashboardPathForRole, useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { BrandedLoaderView } from "@/components/ui/LoadingScreen";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/data-service";
import type { NotificationItem, UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  customer: [
    { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
    { label: "My Complaints", href: "/customer/complaints", icon: TicketIcon },
    { label: "New Complaint", href: "/customer/new-complaint", icon: FilePlus2 },
  ],
  admin: [
    { label: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "All Tickets", href: "/admin/tickets", icon: TicketIcon },
    { label: "Staff & Customers", href: "/admin/staff", icon: Users },
    { label: "Analytics & Reports", href: "/admin/analytics", icon: BarChart3 },
  ],
  staff: [
    { label: "Staff Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { label: "Assigned Tickets", href: "/staff/tickets", icon: TicketIcon },
  ],
};

export function DashboardShell({
  allowedRoles,
  title,
  subtitle,
  children,
}: {
  allowedRoles: UserRole[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { user, loading, isDemoMode, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const list = await fetchNotifications(user.id);
      setNotifications(list);
    } catch {
      // ignore transient errors
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!allowedRoles.includes(user.role)) {
        router.replace(getDashboardPathForRole(user.role));
      }
    }
  }, [loading, user, allowedRoles, router]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <BrandedLoaderView statusText="Loading your BizAssist AI workspace..." />
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="glass-card max-w-md rounded-2xl p-8 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-white" />
          <h2 className="mt-4 text-lg font-bold text-white">
            Checking Authorization...
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Redirecting you to your authorized dashboard.
          </p>
        </div>
      </div>
    );
  }

  const navItems = ROLE_NAV[user.role];

  const getTicketLink = (ticketId: string | null) => {
    if (!ticketId) return getDashboardPathForRole(user.role);
    if (user.role === "customer") return `/customer/ticket/${ticketId}`;
    if (user.role === "staff") return `/staff/ticket/${ticketId}`;
    return `/admin/tickets`;
  };

  const SidebarContent = (
    <div className="flex h-full flex-col border-r border-white/15 bg-[#120206]/75 text-white backdrop-blur-2xl">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/15 px-5 py-3.5">
        <Link href="/" className="flex flex-col items-start gap-1">
          <BrandLogo size="sm" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/75">
            {user.role} Portal
          </p>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-5">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/65">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "crimson-pill-btn text-white"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Supabase or Demo mode indicator */}
      {isDemoMode ? (
        <div className="mx-3 mb-3 rounded-2xl border border-white/20 bg-rose-500/15 p-3 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Demo Mode Active</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-white/80">
            Running with persistent local sample data.
          </p>
        </div>
      ) : (
        <div className="mx-3 mb-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Supabase Cloud Connected</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-white/80 truncate">
            kihcmgipkcmkrxklkavq
          </p>
        </div>
      )}

      {/* User Card & Logout */}
      <div className="border-t border-white/15 p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-2.5">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="h-9 w-9 shrink-0 rounded-full border border-white/30 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-rose-500 to-red-700 text-xs font-bold text-white">
              {user.full_name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-white/75">
              {user.department || user.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="glass-pill-btn mt-2 flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/15 bg-[#120206]/65 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden truncate text-xs text-white/80 sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="hidden rounded-full border border-white/25 bg-rose-600/40 px-3 py-1 text-xs font-semibold text-white sm:inline-flex items-center gap-1 backdrop-blur-md">
                <Sparkles className="h-3 w-3" /> Demo Mode
              </span>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20 transition"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/40 bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 z-40 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/25 bg-[#1b040a]/95 shadow-2xl backdrop-blur-2xl animate-fade-in">
                    <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
                      <span className="text-sm font-bold text-white">
                        Notifications ({unreadCount} unread)
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:underline"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-white/75">
                          No notifications yet. Ticket status changes will appear here.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3.5 transition ${
                              item.is_read ? "bg-transparent" : "bg-rose-500/20"
                            }`}
                          >
                            <Link
                              href={getTicketLink(item.ticket_id)}
                              onClick={() => {
                                handleMarkRead(item.id);
                                setNotifOpen(false);
                              }}
                              className="block"
                            >
                              <p className="text-xs leading-relaxed text-white">
                                {item.message}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/70">
                                <span>
                                  {new Date(item.created_at).toLocaleString()}
                                </span>
                                {!item.is_read && (
                                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                    New
                                  </span>
                                )}
                              </div>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
