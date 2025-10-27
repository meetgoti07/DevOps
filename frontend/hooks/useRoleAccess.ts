import { useAuth } from "@/contexts/AuthContext";

export const useRoleAccess = () => {
  const { user, isAuthenticated } = useAuth();

  const isCustomer = user?.role === "CUSTOMER";
  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF" || user?.role === "ADMIN"; // Admin can also act as staff

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccessAdminDashboard = isAdmin;
  const canAccessStaffDashboard = isStaff;
  const canManageOrders = isStaff;
  const canManageMenu = isAdmin;
  const canManageUsers = isAdmin;
  const canViewAnalytics = isStaff;

  return {
    user,
    isAuthenticated,
    isCustomer,
    isAdmin,
    isStaff,
    hasRole,
    canAccessAdminDashboard,
    canAccessStaffDashboard,
    canManageOrders,
    canManageMenu,
    canManageUsers,
    canViewAnalytics,
  };
};
