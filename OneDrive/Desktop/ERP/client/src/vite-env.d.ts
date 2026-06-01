/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";
  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;
  const icon: LucideIcon;
  export const Activity: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Bell: LucideIcon;
  export const Boxes: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Clock: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Download: LucideIcon;
  export const FileBarChart2: LucideIcon;
  export const FileCheck2: LucideIcon;
  export const FileSpreadsheet: LucideIcon;
  export const IndianRupee: LucideIcon;
  export const KeyRound: LucideIcon;
  export const LogIn: LucideIcon;
  export const LogOut: LucideIcon;
  export const Plus: LucideIcon;
  export const Printer: LucideIcon;
  export const QrCode: LucideIcon;
  export const ReceiptText: LucideIcon;
  export const Save: LucideIcon;
  export const ScanBarcode: LucideIcon;
  export const Search: LucideIcon;
  export const Settings: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Sparkles: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const TriangleAlert: LucideIcon;
  export const Upload: LucideIcon;
  export const UserPlus: LucideIcon;
  export const UserCog: LucideIcon;
  export const Users: LucideIcon;
  export const Wrench: LucideIcon;
  export const X: LucideIcon;
  export default icon;
}
