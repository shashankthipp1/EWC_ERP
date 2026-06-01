import { useAuth } from "../context/AuthContext";

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isStaff = role === "staff";
  const canViewCost = isAdmin || isManager;
  const canManageInventory = canViewCost;
  const canManageUsers = isAdmin;
  const canManageOrders = canViewCost;

  return {
    role,
    isAdmin,
    isManager,
    isStaff,
    canViewCost,
    canManageInventory,
    canManageUsers,
    canManageOrders
  };
}
