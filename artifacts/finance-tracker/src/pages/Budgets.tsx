import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { useListBudgets, useListCategories, Budget, Category } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, PieChart } from "lucide-react";
import { apiFetch } from "@/lib/api";

type BudgetForm = {
  categoryId: string;
  amount: string;
  budgetMonth: string;
  alertThreshold: string;
};

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const defaultForm: BudgetForm = {
  categoryId: "",
  amount: "",
  budgetMonth: getCurrentMonth(),
  alertThreshold: "80",
};

function parseMonthYear(value: string) {
  const [yearStr, monthStr] = value.split("-");
  return {
    year: Number(yearStr),
    month: Number(monthStr),
  };
}

export default function Budgets() {
  const queryClient = useQueryClient();
  const { data: budgets, isLoading } = useListBudgets({});
  const { data: categoriesResponse } = useListCategories();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<BudgetForm>(defaultForm);

  const budgetsData: Budget[] = useMemo(() => {
    if (Array.isArray(budgets)) return budgets;
    if (Array.isArray((budgets as any)?.data)) return (budgets as any).data;
    return [];
  }, [budgets]);

  const categories: Category[] = useMemo(() => {
    if (Array.isArray(categoriesResponse)) return categoriesResponse;
    if (Array.isArray((categoriesResponse as any)?.data)) return (categoriesResponse as any).data;
    return [];
  }, [categoriesResponse]);

  const resetForm = () => {
    setForm({
      categoryId: categories.length > 0 ? String(categories[0].id) : "",
      amount: "",
      budgetMonth: getCurrentMonth(),
      alertThreshold: "80",
    });
    setSubmitError("");
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!form.categoryId) {
      setSubmitError("Category is required.");
      return;
    }

    if (!form.amount.trim()) {
      setSubmitError("Budget amount is required.");
      return;
    }

    if (Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setSubmitError("Enter a valid budget amount.");
      return;
    }

    if (!form.budgetMonth) {
      setSubmitError("Budget month is required.");
      return;
    }

    const { month, year } = parseMonthYear(form.budgetMonth);

    if (!month || !year) {
      setSubmitError("Invalid budget month.");
      return;
    }

    const payload = {
      categoryId: Number(form.categoryId),
      amount: form.amount, // MUST stay string
      month,
      year,
      alertThreshold: form.alertThreshold || "80", // MUST stay string
    };

    setIsSaving(true);

    try {
      const response = await apiFetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // direct body, no { data: ... }
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.details?.[0]?.message ||
            result?.error ||
            result?.message ||
            "Failed to create budget."
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });

      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Create budget failed:", error);
      setSubmitError(error?.message || "Failed to create budget.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Budgets</h1>
          <p className="text-muted-foreground mt-1">Track your monthly spending limits.</p>
        </div>
        <Button
          className="shadow-lg shadow-primary/20"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 animate-pulse h-48"></Card>
          ))
        ) : budgetsData.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card/30 rounded-xl border border-dashed border-border">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground">No active budgets</p>
            <p className="mt-1">Set up budgets to control your spending.</p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Budget
            </Button>
          </div>
        ) : (
          budgetsData.map((budget: Budget) => {
            const amount = typeof budget.amount === "number" ? budget.amount : 0;
            const spent = typeof budget.spent === "number" ? budget.spent : 0;
            const percentage = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
            const isOver = spent > amount;

            return (
              <Card
                key={budget.id}
                className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <span>{budget.category?.name || "General"}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatCurrency(spent)} / {formatCurrency(amount)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 space-y-2">
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOver ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className={isOver ? "text-destructive" : "text-muted-foreground"}>
                        {percentage.toFixed(1)}% spent
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(Math.max(amount - spent, 0))} remaining
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create Budget"
        description="Set a spending limit for one of your categories."
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Budget Amount</label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="1000.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Budget Month</label>
            <Input
              type="month"
              value={form.budgetMonth}
              onChange={(e) => setForm((prev) => ({ ...prev, budgetMonth: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alert Threshold (%)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={form.alertThreshold}
              onChange={(e) => setForm((prev) => ({ ...prev, alertThreshold: e.target.value }))}
              placeholder="80"
            />
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}