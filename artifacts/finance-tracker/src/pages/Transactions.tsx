import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  useListTransactions,
  useDeleteTransaction,
  useListAccounts,
  useListCategories,
  Transaction,
  Account,
  Category,
} from "@workspace/api-client-react";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense", "transfer"]),
  date: z.string().min(1, "Date is required"),
  accountId: z.coerce.number().positive("Account is required"),
  categoryId: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Transactions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: transactionsResponse, isLoading } = useListTransactions({ search });
  const { data: accountsResponse } = useListAccounts();
  const { data: categoriesResponse } = useListCategories();

  const transactions: Transaction[] = useMemo(() => {
    if (Array.isArray(transactionsResponse)) return transactionsResponse;
    if (Array.isArray((transactionsResponse as any)?.data)) return (transactionsResponse as any).data;
    return [];
  }, [transactionsResponse]);

  const accounts: Account[] = useMemo(() => {
    if (Array.isArray(accountsResponse)) return accountsResponse;
    if (Array.isArray((accountsResponse as any)?.data)) return (accountsResponse as any).data;
    return [];
  }, [accountsResponse]);

  const categories: Category[] = useMemo(() => {
    if (Array.isArray(categoriesResponse)) return categoriesResponse;
    if (Array.isArray((categoriesResponse as any)?.data)) return (categoriesResponse as any).data;
    return [];
  }, [categoriesResponse]);

  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly-trends"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/analytics/spending-by-category"] }),
        ]);
      },
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: undefined as unknown as number,
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      accountId: 0,
      categoryId: undefined,
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (accounts.length > 0) setValue("accountId", accounts[0].id);
  }, [accounts, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitError("");
    setIsSaving(true);
    try {
      await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          description: data.description.trim(),
          amount: String(data.amount),
          type: data.type,
          date: data.date,
          accountId: Number(data.accountId),
          categoryId: data.categoryId ? Number(data.categoryId) : null,
        }),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly-trends"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/spending-by-category"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/accounts"] }),
      ]);

      reset({
        description: "",
        amount: undefined as unknown as number,
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        accountId: accounts.length > 0 ? accounts[0].id : 0,
        categoryId: undefined,
      });
      setIsCreateModalOpen(false);
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to save transaction.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage your income and expenses.</p>
        </div>
        <Button
          onClick={() => { setSubmitError(""); setIsCreateModalOpen(true); }}
          className="shadow-lg shadow-primary/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card className="mb-6 bg-card/50 backdrop-blur-sm border-border/50 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-secondary rounded w-3/4" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary rounded w-1/2" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary rounded w-1/2" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-secondary rounded w-1/4 ml-auto" /></td>
                    <td className="px-6 py-4" />
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          tx.type === "income" ? "bg-emerald-500/10 text-emerald-400"
                          : tx.type === "expense" ? "bg-destructive/10 text-destructive"
                          : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {tx.type === "income" ? <ArrowUpRight className="h-4 w-4" />
                          : tx.type === "expense" ? <ArrowDownRight className="h-4 w-4" />
                          : <ArrowRightLeft className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.account?.name || `Account #${tx.accountId}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {tx.category?.name ? (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-normal">
                          {tx.category.name}
                        </Badge>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {format(parseISO(tx.date), "MMM d, yyyy")}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-medium whitespace-nowrap ${
                      tx.type === "income" ? "text-emerald-400"
                      : tx.type === "expense" ? "text-foreground"
                      : "text-blue-400"
                    }`}>
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this transaction?")) deleteMutation.mutate({ id: tx.id });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setSubmitError(""); setIsCreateModalOpen(false); }}
        title="Add Transaction"
        description="Enter the details of your transaction."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-4">
              {["expense", "income", "transfer"].map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input type="radio" value={type} {...register("type")} className="text-primary" />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input {...register("description")} placeholder="Grocery, Salary, etc." />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" step="0.01" {...register("amount")} placeholder="0.00" />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Account</label>
            <select
              {...register("accountId")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {accounts.length === 0 ? (
                <option value="">No accounts — add one first</option>
              ) : (
                accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)
              )}
            </select>
            {errors.accountId && <p className="text-sm text-destructive">{errors.accountId.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category <span className="text-muted-foreground font-normal">(optional)</span></label>
            <select
              {...register("categoryId")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">— None —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => { setSubmitError(""); setIsCreateModalOpen(false); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>Save Transaction</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
