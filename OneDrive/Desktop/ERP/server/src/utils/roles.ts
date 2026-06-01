/** Admin and manager can view cost, profit, and manage inventory. */
export function canViewCost(role?: string): boolean {
  return role === "admin" || role === "manager";
}

export function canManageInventory(role?: string): boolean {
  return canViewCost(role);
}

export function canManageUsers(role?: string): boolean {
  return role === "admin";
}
