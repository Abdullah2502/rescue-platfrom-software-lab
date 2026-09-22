"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Award, CalendarDays, LayoutDashboard, UserCircle, MapPinned, Building2, Globe, MessagesSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/sidebar";
import { ToastHost } from "@/components/ui/toast";

const NAV = [
  { href: "/volunteer/dashboard",    label: "Dashboard",       icon: LayoutDashboard, exact: true },
  { href: "/volunteer/global-chat",  label: "Global Chat",     icon: Globe },
  { href: "/volunteer/event-chats",  label: "Event Chats",     icon: MessagesSquare },
  { href: "/volunteer/events",       label: "Find events",     icon: CalendarDays },
  { href: "/volunteer/ngos",         label: "Browse NGOs",     icon: Building2 },
  { href: "/volunteer/certificates",label: "Certificates",    icon: Award },
  { href: "/volunteer/operations", label: "Shelters & aid",   icon: MapPinned },
  { href: "/volunteer/profile",      label: "Profile",         icon: UserCircle },
];

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const principal = useAuth((s) => s.principal);

  useEffect(() => {
    if (principal === null) return;
    if (principal.role !== "ROLE_VOLUNTEER") router.replace("/login");
  }, [principal, router]);

  if (principal === null) return <div className="p-10 text-sm text-mist">Loading…</div>;
  return (
    <AppShell role="ROLE_VOLUNTEER" nav={NAV}>
      {children}
      <ToastHost />
    </AppShell>
  );
}
