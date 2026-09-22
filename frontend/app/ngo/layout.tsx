"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, UploadCloud, Megaphone, Plus, Building2, Warehouse, Globe, MessagesSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/sidebar";
import { ToastHost } from "@/components/ui/toast";

const NAV = [
  { href: "/ngo/dashboard",       label: "Dashboard",        icon: LayoutDashboard, exact: true },
  { href: "/ngo/global-chat",     label: "Global Chat",      icon: Globe },
  { href: "/ngo/event-chats",     label: "Mission Chats",    icon: MessagesSquare },
  { href: "/ngo/volunteers",      label: "Volunteers",       icon: Users },
  { href: "/ngo/volunteers/new",  label: "Add volunteer",    icon: UserPlus },
  { href: "/ngo/volunteers/bulk", label: "Bulk upload",      icon: UploadCloud },
  { href: "/ngo/events",          label: "Events",           icon: Megaphone },
  { href: "/ngo/events/new",      label: "Create event",     icon: Plus },
  { href: "/ngo/operations",      label: "Field operations", icon: Warehouse },
  { href: "/ngo/profile",         label: "Profile",          icon: Building2 },
];

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const principal = useAuth((s) => s.principal);

  useEffect(() => {
    if (principal === null) return;
    if (principal.role !== "ROLE_NGO_ADMIN") router.replace("/login");
  }, [principal, router]);

  if (principal === null) return <div className="p-10 text-sm text-mist">Loading…</div>;
  return (
    <AppShell role="ROLE_NGO_ADMIN" nav={NAV}>
      {children}
      <ToastHost />
    </AppShell>
  );
}
