'use client';

import { useAuth } from '@/context/AuthContext';
import { useCartContext } from '@/context/CartContext';
import {
  ShoppingBag,
  User,
  Menu,
  LogOut,
  ShoppingCart,
  Heart,
  Package,
  Store,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import NavbarSearch from '@/components/search/NavbarSearch';

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { cartCount } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <SheetHeader className="border-b pb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 py-4">
                <SheetClose asChild>
                  <Link
                    href="/"
                    className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/products"
                    className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/categories"
                    className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Categories
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/flash-sale"
                    className="flex items-center px-4 py-2 rounded-md hover:bg-accent text-red-500 font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Flash Sale 🔥
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/cart"
                    className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Cart
                  </Link>
                </SheetClose>
                {user && (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/account"
                        className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="mr-2 h-4 w-4" /> Account
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Package className="mr-2 h-4 w-4" /> Orders
                      </Link>
                    </SheetClose>
                    {isAdmin && (
                      <SheetClose asChild>
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Store className="mr-2 h-4 w-4" /> Admin
                        </Link>
                      </SheetClose>
                    )}
                    <button
                      className="flex items-center px-4 py-2 rounded-md hover:bg-accent text-left"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </button>
                  </>
                )}
                {!user && (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/register"
                        className="flex items-center px-4 py-2 rounded-md hover:bg-accent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <span className="font-bold text-xl">E-com</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Products
          </Link>
          <Link
            href="/categories"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Categories
          </Link>
          <Link
            href="/flash-sale"
            className="text-sm font-medium transition-colors hover:text-primary text-red-500 font-bold animate-pulse"
          >
            Flash Sale
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* Only render theme toggle when mounted to avoid hydration mismatch */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Replace the search button with our new NavbarSearch component */}
          <NavbarSearch />

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
                  variant="destructive"
                >
                  {cartCount}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {profile?.first_name} {profile?.last_name}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <User className="mr-2 h-4 w-4" /> Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <Package className="mr-2 h-4 w-4" /> Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist">
                    <Heart className="mr-2 h-4 w-4" /> Wishlist
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Store className="mr-2 h-4 w-4" /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
