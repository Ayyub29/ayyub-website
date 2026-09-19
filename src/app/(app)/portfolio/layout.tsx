import { PortfolioNav } from "@/components/portfolio-nav";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PortfolioNav />
      {children}
    </div>
  );
}
