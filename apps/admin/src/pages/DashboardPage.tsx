import { useQuery } from "@tanstack/react-query";
import {
  Users,
  DollarSign,
  CalendarCheck,
  Landmark,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { dashboardApi } from "@/api/dashboard";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDateOnly, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.stats,
  });

  const bookingsSeries = (data?.bookingsOverTime ?? []).map((p) => ({
    date: formatDateOnly(p.date),
    value: p.value,
  }));
  const signupsSeries = (data?.providerSignupsOverTime ?? []).map((p) => ({
    date: formatDateOnly(p.date),
    value: p.value,
  }));

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active Providers"
          value={formatNumber(data?.activeProviders ?? 0)}
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="MRR"
          value={formatCurrency(data?.mrr ?? 0)}
          icon={DollarSign}
          tone="green"
        />
        <StatCard
          label="Total Bookings"
          value={formatNumber(data?.totalBookings ?? 0)}
          icon={CalendarCheck}
          tone="blue"
        />
        <StatCard
          label="Gross Deposit Volume"
          value={formatCurrency(data?.grossDepositVolume ?? 0)}
          icon={Landmark}
          tone="purple"
        />
        <StatCard
          label="Pending Payouts"
          value={formatNumber(data?.pendingPayouts ?? 0)}
          icon={Wallet}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings over time</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {bookingsSeries.length === 0 ? (
              <EmptyChartState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={bookingsSeries}>
                  <defs>
                    <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Bookings"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#bookingsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider signups over time</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {signupsSeries.length === 0 ? (
              <EmptyChartState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={signupsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Signups" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
      No time-series data available yet
    </div>
  );
}
