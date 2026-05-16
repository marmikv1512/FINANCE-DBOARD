import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useGetSpendingByCategory, useGetMonthlyTrends } from "@workspace/api-client-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "hsl(153, 60%, 53%)",
  "hsl(210, 100%, 56%)",
  "hsl(270, 60%, 60%)",
  "hsl(30, 90%, 60%)",
  "hsl(0, 84%, 60%)",
  "hsl(180, 50%, 50%)",
];

export default function Analytics() {
  const { data: spending, isLoading: isLoadingSpending } = useGetSpendingByCategory({});
  const { data: trends, isLoading: isLoadingTrends } = useGetMonthlyTrends({ months: 12 });

  const spendingData = Array.isArray(spending)
    ? spending
    : Array.isArray((spending as any)?.data)
    ? (spending as any).data
    : [];

  const trendsData = Array.isArray(trends)
    ? trends
    : Array.isArray((trends as any)?.data)
    ? (trends as any).data
    : [];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your financial data.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingSpending ? (
                <div className="w-full h-full bg-secondary/50 animate-pulse rounded-lg"></div>
              ) : spendingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="amount"
                      stroke="none"
                    >
                      {spendingData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Net Savings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingTrends ? (
                <div className="w-full h-full bg-secondary/50 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="hsl(153, 60%, 53%)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "hsl(153, 60%, 53%)" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}