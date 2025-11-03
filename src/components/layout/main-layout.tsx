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
  SidebarTrigger,
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
  Award,
  Settings,
  Gavel,
  Repeat,
  Gift,
  Languages,
} from 'lucide-react';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/context/language-context';

const navItems = [
  { href: '/', label: 'dashboard', icon: LayoutDashboard },
  { href: '/store', label: 'playerDatabase', icon: Store },
  { href: '/daily-market', label: 'dailyMarket', icon: Gavel },
  { href: '/roster', label: 'myRoster', icon: Users },
  { href: '/rankings', label: 'rankings', icon: BarChart },
  { href: '/next-week', label: 'weeklySummary', icon: Calendar },
  { href: '/player-market', label: 'leagueHonors', icon: Award },
];

const playerShopItem = { href: '/player-shop', label: 'assignPlayer', icon: Gift };
const settingsItem = { href: '/settings', label: 'settings', icon: Settings };

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, switchUser, allUsers } = useUser();
  const { t, setLanguage, language } = useLanguage();

  const getPageTitle = () => {
    if (pathname.startsWith('/weeks/')) {
      const weekId = pathname.split('/')[2];
      return `${t('week')} ${weekId} ${t('summary')}`;
    }
    const allNavItems =
      user?.id === 'user-sipgb' ? [...navItems, playerShopItem, settingsItem] : navItems;
    const currentNav = allNavItems.find(
      (item) =>
        item.href !== '/' && pathname.startsWith(item.href)
    );
     if (pathname === '/') return t('dashboard');
    return currentNav ? t(currentNav.label) : 'Kart Fantasy League';
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const allNavItems = user.id === 'user-sipgb' ? [...navItems, playerShopItem, settingsItem] : navItems;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            <span className="font-bold text-lg text-sidebar-foreground font-headline">
              Kart Fantasy
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {allNavItems.map((item) => {
              const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={{
                      children: t(item.label),
                      className: 'font-body',
                    }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{t(item.label)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-semibold font-headline hidden md:block">
            {getPageTitle()}
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <DollarSign className="w-5 h-5" />
              <span>{(user?.currency ?? 0).toLocaleString()}</span>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-auto px-2 flex items-center gap-2">
                  <Languages className="w-4 h-4"/>
                  <span className="uppercase text-xs font-bold">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setLanguage('en')} disabled={language === 'en'}>English</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setLanguage('es')} disabled={language === 'es'}>Español</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <span>{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {allUsers.map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onSelect={() => switchUser(u.id)}
                    disabled={u.id === user.id}
                  >
                    {u.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
