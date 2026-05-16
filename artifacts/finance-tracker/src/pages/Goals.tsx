import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { useListGoals, Goal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiFetch } from "@/lib/api";

type GoalForm = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
};

const getDefaultGoalDate = () => {
  const now = new Date();
  now.setMonth(now.getMonth() + 6);
  return now.toISOString().split("T")[0];
};

const defaultForm: GoalForm = {
  name: "",
  targetAmount: "",
  currentAmount: "0",
  targetDate: getDefaultGoalDate(),
};

export default function Goals() {
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useListGoals();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<GoalForm>(defaultForm);

  const goalsData: Goal[] = useMemo(() => {
    if (Array.isArray(goals)) return goals;
    if (Array.isArray((goals as any)?.data)) return (goals as any).data;
    return [];
  }, [goals]);

  const resetForm = () => {
    setForm({
      ...defaultForm,
      targetDate: getDefaultGoalDate(),
    });
    setSubmitError("");
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!form.name.trim()) {
      setSubmitError("Goal name is required.");
      return;
    }

    if (!form.targetAmount.trim() || Number.isNaN(Number(form.targetAmount)) || Number(form.targetAmount) <= 0) {
      setSubmitError("Enter a valid target amount.");
      return;
    }

    if (form.currentAmount.trim() && Number.isNaN(Number(form.currentAmount))) {
      setSubmitError("Enter a valid current amount.");
      return;
    }

    if (!form.targetDate) {
      setSubmitError("Target date is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      targetAmount: form.targetAmount, // likely string, same pattern as budgets
      currentAmount: form.currentAmount || "0",
      targetDate: form.targetDate,
    };

    setIsSaving(true);

    try {
      const variants = [
        payload,
        { data: payload },
        {
          ...payload,
          targetDate: new Date(form.targetDate).toISOString(),
        },
        {
          data: {
            ...payload,
            targetDate: new Date(form.targetDate).toISOString(),
          },
        },
      ];

      let success = false;
      let lastError = "Failed to create goal.";

      for (const body of variants) {
        const response = await apiFetch("/api/goals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          success = true;
          break;
        }

        try {
          const err = await response.json();
          lastError = err?.error || err?.message || lastError;
        } catch {
          lastError = response.statusText || lastError;
        }
      }

      if (!success) {
        throw new Error(lastError);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/goals"] });

      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Create goal failed:", error);
      setSubmitError(error?.message || "Failed to create goal.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Plan and track your future savings.</p>
        </div>
        <Button
          className="shadow-lg shadow-primary/20"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          [1, 2].map((i) => (
            <Card key={i} className="bg-card/50 animate-pulse h-48"></Card>
          ))
        ) : goalsData.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card/30 rounded-xl border border-dashed border-border">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground">No saving goals yet</p>
            <p className="mt-1">Define what you're saving for.</p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Goal
            </Button>
          </div>
        ) : (
          goalsData.map((goal: Goal) => {
            const currentAmount = typeof goal.currentAmount === "number" ? goal.currentAmount : 0;
            const targetAmount = typeof goal.targetAmount === "number" ? goal.targetAmount : 0;
            const percentage = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

            return (
              <Card
                key={goal.id}
                className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Target className="h-24 w-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{goal.name}</CardTitle>
                  {goal.targetDate && (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                      <Calendar className="mr-1.5 h-4 w-4" />
                      Target: {format(parseISO(goal.targetDate), "MMM yyyy")}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="mt-4">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-3xl font-bold font-mono text-primary">
                        {formatCurrency(currentAmount)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        / {formatCurrency(targetAmount)}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden mt-4">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
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
        title="Create Goal"
        description="Add a savings goal and track your progress."
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Emergency Fund, New Laptop, Vacation..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Amount</label>
              <Input
                type="number"
                step="0.01"
                value={form.targetAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
                placeholder="10000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Current Amount</label>
              <Input
                type="number"
                step="0.01"
                value={form.currentAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, currentAmount: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Date</label>
            <Input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))}
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
              Save Goal
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}