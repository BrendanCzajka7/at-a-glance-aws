import type { ReactNode } from "react";

type DashboardLayoutProps = {
  topLeft: ReactNode;
  bottomLeft: ReactNode;
  right: ReactNode;
  className?: string;
};

export default function DashboardLayout({
  topLeft,
  bottomLeft,
  right,
  className = "",
}: DashboardLayoutProps) {
  return (
    <main className={className}>
      {topLeft}
      {bottomLeft}
      {right}
    </main>
  );
}