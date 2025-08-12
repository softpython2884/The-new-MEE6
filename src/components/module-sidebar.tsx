'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrainCircuit, Cog, LayoutGrid, LogOut, Shield, TerminalSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/moderation', label: 'Moderation', icon: Shield },
  { href: '/dashboard/modules', label: 'Modules', icon: Cog },
  { href: '/dashboard/commands', label: 'Custom Commands', icon: TerminalSquare },
  { href: '/dashboard/ai-suggestions', label: 'AI Suggestions', icon: BrainCircuit, isNew: true },
];

export function ModuleSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card p-4">
      <div className="mb-6 flex items-center gap-3 px-2">
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage src="https://placehold.co/64x64/2c3e50/00bcd4.png" data-ai-hint="server logo" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">Gaming Community</h2>
          <p className="text-sm text-muted-foreground">Premium User</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} passHref>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                asChild
              >
                <a>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.isNew && <Badge variant="outline" className='ml-auto bg-primary/20 text-primary border-primary/50'>New</Badge>}
                </a>
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-4">
        <Separator className="bg-border/50" />
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="h-10 w-10">
              <AvatarImage src="https://placehold.co/64x64.png" data-ai-hint="user avatar" />
              <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
              <p className="font-semibold">Username</p>
              <p className="text-sm text-muted-foreground">user@example.com</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/">
              <LogOut className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
