"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Tags, Settings2, Users, LogOut, Palette } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useLogout } from "@/hooks/use-logout";
import { ADMIN_LOGIN_PATH } from "@/lib/constants/auth.constant";

const NAV_ITEMS = [
  { title: "Categories", url: "/admin/categories", icon: Tags },
  { title: "Words", url: "/admin/words", icon: LayoutGrid },
  { title: "App Config", url: "/admin/app-config", icon: Settings2 },
  { title: "Users", url: "/admin/users", icon: Users },
];

function initialsFor(name: string | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useCurrentUser();
  const logout = useLogout();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Palette className="size-4" />
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">Pictionary Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                    render={<Link href={item.url} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initialsFor(data?.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium">{data?.user.name ?? "..."}</span>
            <span className="truncate text-xs text-muted-foreground">{data?.user.email ?? ""}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2"
          disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSuccess: () => router.push(ADMIN_LOGIN_PATH) })}
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Log out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
