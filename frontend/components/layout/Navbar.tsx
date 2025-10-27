"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShoppingCart,
  User,
  LogOut,
  Settings,
  BarChart3,
  Users,
} from "lucide-react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const {
    isCustomer,
    isAdmin,
    isStaff,
    canAccessAdminDashboard,
    canAccessStaffDashboard,
  } = useRoleAccess();
  const { items } = useCartStore();

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/20 professional-header backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <img
              src="/canteen-logo.svg"
              alt="Canteen Queue Logo"
              className="h-10 w-10 transition-transform group-hover:scale-110 drop-shadow-lg"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-white drop-shadow-sm">
              Canteen Queue
            </span>
            <span className="text-xs text-white/80 -mt-1">
              Smart Ordering System
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-6">
            {isCustomer && (
              <>
                <Link
                  href="/menu"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
                >
                  Menu
                </Link>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
                >
                  My Orders
                </Link>
                <Link
                  href="/queue"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
                >
                  Queue Status
                </Link>
              </>
            )}

            {canAccessStaffDashboard && (
              <>
                <Link
                  href="/staff"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
                >
                  Staff Dashboard
                </Link>
                <Link
                  href="/staff/queue"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
                >
                  Queue Management
                </Link>
              </>
            )}

            {canAccessAdminDashboard && (
              <>
                <Link
                  href="/admin"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/menu"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
                >
                  Menu Management
                </Link>
              </>
            )}
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Cart Button - Only for customers */}
              {isCustomer && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="relative bg-white/10 text-white border-white/50 hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <Link href="/cart">
                    <ShoppingCart className="h-4 w-4 text-white" />
                    {cartItemCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white"
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full hover:bg-white/20 p-0"
                  >
                    <Avatar className="h-8 w-8 border-2 border-white/60">
                      <AvatarFallback className="bg-white text-purple-600 font-bold text-sm">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                      <Badge variant="outline" className="w-fit text-xs">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {canAccessStaffDashboard && (
                    <DropdownMenuItem asChild>
                      <Link href="/staff" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Staff Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {canAccessAdminDashboard && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-white/90 hover:text-white hover:bg-white/20 drop-shadow-sm"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
              >
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
