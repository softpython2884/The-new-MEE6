'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';

function DraftbotLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M43.7917 20.8333C45.875 18.75 48.7917 18.3333 51.2917 19.5833C53.7917 20.8333 55.4167 23.3333 55.4167 26.25V37.5C55.4167 43.3333 56.6667 45.8333 60.4167 47.9167C64.1667 50 68.75 50 72.0833 50H73.75C76.6667 50 79.1667 51.6667 80.4167 54.1667C81.6667 56.6667 81.25 59.5833 79.1667 61.6667L45.4167 95.4167C43.3333 97.5 40.4167 97.9167 37.9167 96.6667C35.4167 95.4167 33.7917 92.9167 33.7917 90V75C33.7917 69.1667 32.5417 66.6667 28.7917 64.5833C25.0417 62.5 20.4583 62.5 17.125 62.5H15.4583C12.5417 62.5 10.0417 60.8333 8.79167 58.3333C7.54167 55.8333 7.95833 52.9167 10.0417 50.8333L43.7917 20.8333Z" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round"/>
        <path d="M57.9167 43.75L41.6667 27.5" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <DraftbotLogo />
        <h1 className="text-xl font-bold text-white">DRAFTBOT</h1>
      </div>
      <nav className="flex items-center gap-6 text-sm font-semibold text-muted-foreground">
        <Link href="#" className="transition-colors hover:text-white">
          DOCUMENTATION
        </Link>
        <Link href="#" className="transition-colors hover:text-white">
          PREMIUM
        </Link>
        <Link href="#" className="transition-colors hover:text-white">
          STATUTS
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 transition-colors hover:text-white">
              SUPPORT <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Help Center</DropdownMenuItem>
            <DropdownMenuItem>Contact Us</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <div className="flex items-center gap-4">
        <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">SUPPORT</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/40x40/8e44ad/ffffff.png" data-ai-hint="user avatar" />
                <AvatarFallback>NF</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-white">Night Fury</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href="/" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
