"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import profile from '@/public/images/me.jpg';
import Image from "next/image";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ArrowLeft, BookOpen, ChartBarDecreasing, Grid3x3, LayoutGrid } from "lucide-react";
import { clearToken, currentUser } from "@/lib/api";

const studentLinks = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <LayoutGrid className="h-5 w-5 shrink-0 text-neutral-200" />
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <ChartBarDecreasing className="h-5 w-5 shrink-0 text-neutral-200" />
    ),
  },
  {
    label: "Table",
    href: "/table",
    icon: (
      <Grid3x3 className="h-5 w-5 shrink-0 text-neutral-200" />
    ),
  },
];

const adminLinks = [
  {
    label: "Courses",
    href: "/courses",
    icon: (
      <BookOpen className="h-5 w-5 shrink-0 text-neutral-200" />
    ),
  },
];

const studentOnlyPaths = ["/", "/analytics", "/table"];

export function SidebarDemo({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [checked, setChecked] = useState(false);

  // Every page but /login needs a valid token; read it after mount (localStorage is browser-only).
  useEffect(() => {
    const u = currentUser();
    setUser(u);
    setChecked(true);
    if (!u && pathname !== "/login") {
      clearToken();
      router.replace("/login");
      return;
    }
    // Admins manage courses; send them away from the student board.
    if (u?.role === "ADMIN" && studentOnlyPaths.includes(pathname)) {
      router.replace("/courses");
    }
  }, [pathname, router]);

  const logout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearToken();
    setUser(null);
    router.replace("/login");
  };

  const links = user?.role === "ADMIN" ? adminLinks : studentLinks;
  const [open, setOpen] = useState(false);

  if (pathname === "/login") {
    return <div className="h-screen w-full bg-dark-bg">{children}</div>;
  }
  if (!checked || !user) {
    return <div className="h-screen w-full bg-dark-bg" />;
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border bg-gray-100 md:flex-row  dark:bg-dark-bg",
        "h-screen", 
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <SidebarAccount user={user} onLogout={logout} />
        </SidebarBody>
      </Sidebar>
      <Dashboard>{children}</Dashboard>
    </div>
  );
}
function SidebarAccount({
  user,
  onLogout,
}: {
  user: { username: string; role: string };
  onLogout: (e: React.MouseEvent) => void;
}) {
  const { open, animate } = useSidebar();
  const expanded = animate ? open : true;
  const rawName = user.role === "ADMIN" ? "admin" : user.username;
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Image src={profile} className="h-7 w-7 shrink-0" alt="Profile" />
        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="truncate text-sm text-neutral-200"
        >
          {name}
        </motion.span>
      </div>
      {expanded && (
        <button
          type="button"
          onClick={onLogout}
          aria-label="Logout"
          title="Logout"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-neutral-500 text-neutral-200 transition-colors hover:border-neutral-300 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center py-1 text-sm font-normal text-black"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold whitespace-pre text-white font-logo text-xl"
      >
        Study Planner
      </motion.span>
    </a>
  );
};
// The collapsed sidebar is too narrow for the full name.
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center py-1 text-sm font-normal text-black"
    >
      <span className="font-bold text-white font-logo text-xl">SP</span>
    </a>
  );
};


const Dashboard = ({ children } : {children: React.ReactNode}) => {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:px-10 md:py-8 dark:border-neutral-700 dark:bg-neutral-900">
      <LocalizationProvider dateAdapter={AdapterDateFns}>
      {children}
    </LocalizationProvider>

      </div>
    </div>
  );
};
