import ChartCard from "@/components/ChartCard";
import MetricCard from "@/components/MetricCard";
import DashboardShell from "@/components/DashboardShell";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      <h1 className="text-2xl font-semibold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard title="Sales" value="42,500" change="+8%" />
        <MetricCard title="Omzet" value="3,421" change="+4%" />
        <MetricCard title="Conversion" value="4.2%" change="+0.3%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="2023 vs 2024 " />
        <ChartCard title="Secondary Chart" />
      </div>

      <DashboardClient />
    </DashboardShell>
  );
}
