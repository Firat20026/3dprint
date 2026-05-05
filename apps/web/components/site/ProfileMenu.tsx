"use client";

import Link from "next/link";
import {
  User as UserIcon,
  LogOut,
  Package,
  Heart,
  CreditCard,
  Box,
  Wallet,
  Settings,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ProfileMenuProps {
  initial: string;
  name: string | null;
  email: string;
  isAdmin?: boolean;
  logoutAction: () => void | Promise<void>;
}

const items = [
  { href: "/account", label: "Profil", icon: UserIcon },
  { href: "/account/orders", label: "Siparişler", icon: Package },
  { href: "/account/my-designs", label: "Tasarımlarım", icon: Box },
  { href: "/account/wishlist", label: "Favoriler", icon: Heart },
  { href: "/account/credits", label: "Kredilerim", icon: CreditCard },
  { href: "/account/earnings", label: "Kazançlarım", icon: Wallet },
  { href: "/account/settings", label: "Ayarlar", icon: Settings },
];

export function ProfileMenu({ initial, name, email, isAdmin, logoutAction }: ProfileMenuProps) {
  return (
    // modal={false} — Radix's default modal mode locks body scroll and hides
    // the scrollbar, which causes a horizontal layout jump on open. Non-modal
    // keeps native scrolling and the page stays put.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Profil menüsü"
        className="inline-flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 pb-2 pt-1">
          <p className="line-clamp-1 text-sm font-medium text-foreground">
            {name ?? email.split("@")[0]}
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                <Icon className="size-4 text-muted-foreground" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button
            type="submit"
            className="relative flex w-full cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-secondary"
          >
            <LogOut className="size-4 text-muted-foreground" />
            Çıkış yap
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
