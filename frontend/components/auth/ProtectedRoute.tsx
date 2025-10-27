"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, hasRole } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (!hasRole(allowedRoles)) {
      // Redirect based on user role
      if (user?.role === "CUSTOMER") {
        router.push("/menu");
      } else if (user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/staff");
      }
    }
  }, [isAuthenticated, user, hasRole, allowedRoles, router, redirectTo]);

  if (!isAuthenticated || !hasRole(allowedRoles)) {
    return (
      <div className="page-container">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
