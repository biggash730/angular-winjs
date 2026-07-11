import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "slate"
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  // bookings
  PendingPayment: "amber",
  Confirmed: "blue",
  Cancelled: "red",
  Completed: "green",
  NoShow: "slate",
  // payments
  Pending: "amber",
  Succeeded: "green",
  Failed: "red",
  Refunded: "purple",
  // payouts
  Processing: "blue",
  // subscriptions
  Trialing: "blue",
  Active: "green",
  PastDue: "amber",
  Canceled: "red",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE_MAP[status] ?? "slate";
  return <Badge tone={tone}>{status}</Badge>;
}
