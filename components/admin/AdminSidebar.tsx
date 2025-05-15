'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Layers,
  BarChart,
  FileText,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const adminRoutes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
  },
  {
    label: 'Products',
    icon: Package,
    href: '/admin/products',
  },
  {
    label: 'Categories',
    icon: Layers,
    href: '/admin/categories',
  },
  {
    label: 'Orders',
    icon: ShoppingBag,
    href: '/admin/orders',
  },
  {
    label: 'Customers',
    icon: Users,
    href: '/admin/customers',
  },
  {
    label: 'Coupons',
    icon: FileText,
    href: '/admin/coupons',
  },
  {
    label: 'Analytics',
    icon: BarChart,
    href: '/admin/analytics',
  },
  {
    label: 'Inventory',
    icon: FileText,
    href: '/admin/inventory',
  },
  {
    label: 'Templates',
    icon: Bell,
    href: '/admin/templates',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "h-full border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            {!collapsed && (
              <Link href="/admin/dashboard" className="font-bold text-lg">
                Admin Panel
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "rounded-full p-0 w-8 h-8",
                collapsed && "ml-auto mr-auto"
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 px-2">
            {adminRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center py-3 px-3 rounded-md transition-colors",
                  pathname === route.href
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted",
                  collapsed ? "justify-center" : "justify-start"
                )}
              >
                <route.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
                {!collapsed && <span>{route.label}</span>}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Info */}
        <div className="p-4 border-t">
          <Link
            href="/"
            className={cn(
              "flex items-center py-2 rounded-md hover:bg-muted transition-colors",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <ShoppingBag className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
            {!collapsed && <span>Back to Store</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}