'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Store,
  Users,
  BarChart,
  Trophy,
  DollarSign,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/store', label: 'Player Store', icon: Store },
  { href: '/roster', label: 'My Roster', icon: Users },
  { href: '/rankings', label: 'Rankings', icon: BarChart },
  { href: '/next-week', label: 'Weekly Summary', icon: Calendar },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, switchUser, allUsers } = useUser();

  const getPageTitle = () => {
    if (pathname.startsWith('/weeks/')) {
        const weekId = pathname.split('/')[2];
        return `Week ${weekId} Summary`;
    }
    const currentNav = navItems.find(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
    return currentNav?.label || 'Kart Fantasy League';
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            <span className="font-bold text-lg text-sidebar-foreground font-headline">Kart Fantasy</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={{
                    children: item.label,
                    className: "font-body",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold font-headline hidden md:block">{getPageTitle()}</h1>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <DollarSign className="w-5 h-5"/>
                <span>{user ? user.currency.toLocaleString() : '...'}</span>
              </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <span>{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {allUsers.map((u) => (
                    <DropdownMenuItem key={u.id} onSelect={() => switchUser(u.id)} disabled={u.id === user.id}>
                      {u.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
