import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useGetAnalyticsSummary, useListTransactions, useGetMonthlyTrends } from "@workspace/api-client-react";
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Activity, Plus, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetAnalyticsSummary({});
  const { data: transactions, isLoading: isLoadingTx } = useListTransactions({ limit: 5 });
  const { data: trends, isLoading: isLoadingTrends } = useGetMonthlyTrends({ months: 6 });

  const recentTransactions = Array.isArray(transactions?.data) ? transactions.data : [];
  const chartData = Array.isArray(trends) ? trends : Array.isArray(trends?.data) ? trends.data : [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your financial overview.</p>
        </div>
        <Link
          href="/transactions"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {formatCurrency(summary?.netSavings || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrency(summary?.totalIncome || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold font-mono text-destructive">
                  {formatCurrency(summary?.totalExpenses || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold font-mono text-blue-400">
                  {typeof summary?.savingsRate === "number" ? summary.savingsRate.toFixed(1) : "0.0"}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Target: 20%</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
        <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingTrends ? (
                <div className="w-full h-full bg-secondary/50 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--secondary))" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value: number) => [formatCurrency(value), undefined]}
                    />
                    <Bar dataKey="income" name="Income" fill="hsl(153, 60%, 53%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-border/50 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoadingTx ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-secondary/50 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          tx.type === "income"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : tx.type === "expense"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : tx.type === "expense" ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : (
                          <ArrowRightLeft className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(tx.date), "MMM d, yyyy")} &middot; {tx.category?.name || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`font-mono font-medium ${
                        tx.type === "income"
                          ? "text-emerald-400"
                          : tx.type === "expense"
                          ? "text-foreground"
                          : "text-blue-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <Wallet className="h-10 w-10 mb-4 opacity-20" />
                <p>No recent transactions</p>
                <Link href="/transactions" className="text-primary text-sm hover:underline mt-2">
                  Add one now
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}