import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Brain, FolderOpen, Users, Settings as SettingsIcon, Package } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const items = [
    { title: "Workspace", url: "/", icon: Brain },
    { title: "Datasets", url: "/datasets", icon: FolderOpen },
    { title: "Agents", url: "/agents", icon: Users },
    { title: "Products", url: "/products", icon: Package },
    { title: "Settings", url: "/settings", icon: SettingsIcon },
  ];

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar 
      className={`transition-all duration-300 ${collapsed ? "w-14" : "w-60"} border-r border-border/50`} 
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-to-b from-card to-card/80">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold tracking-wide">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">🥋</span>
                Sensei AI
              </div>
            ) : (
              <span className="text-lg">🥋</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="transition-all duration-200 hover:bg-primary/10 hover:border-primary/20 rounded-md group"
                  >
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                      {!collapsed && (
                        <span className="group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
