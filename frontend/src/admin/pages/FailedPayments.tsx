import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Unlock } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column } from "../components/DataTable";
import AdminLayout from "../components/AdminLayout";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { adminApi } from "../services/api";
import { AdminTransaction, CURRENCY_SYMBOLS } from "../types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const FailedPayments: React.FC = () => {
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockTarget, setUnlockTarget] = useState<AdminTransaction | null>(null);
  const [reason, setReason] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    Promise.all([adminApi.getTransactions(), adminApi.getSettings()])
      .then(([txResponse, settings]) => {
        setTransactions(txResponse.transactions.filter((txn) => txn.status === "failed"));
        setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? "$");
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (cents: number, currency?: string) => {
    const symbol = currency === "INR" ? "₹" : currencySymbol;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  const handleUnlock = async () => {
    if (!unlockTarget || !reason.trim()) {
      return;
    }
    try {
      await adminApi.unlockTemplate(unlockTarget.customerId, unlockTarget.templateSlug, reason);
      toast({ title: `Template "${unlockTarget.templateName}" unlocked for ${unlockTarget.customerName}` });
      setUnlockTarget(null);
      setReason("");
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const columns: Column<AdminTransaction>[] = [
    { key: "customerName", label: "Customer", sortable: true },
    { key: "templateName", label: "Template", sortable: true },
    { key: "amount", label: "Amount", sortable: true, render: (row) => fmt(row.amount, row.currency) },
    { key: "date", label: "Date", sortable: true, render: (row) => format(new Date(row.date), "dd MMM yyyy, HH:mm") },
    {
      key: "failureReason",
      label: "Reason",
      render: (row) => <span className="text-destructive text-xs">{row.failureReason}</span>,
    },
    {
      key: "actions",
      label: "",
      hideable: false,
      render: (row) =>
        hasPermission("manual_unlock") ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={(event) => {
              event.stopPropagation();
              setUnlockTarget(row);
              setReason("");
            }}
          >
            <Unlock className="h-3 w-3 mr-1" /> Unlock
          </Button>
        ) : null,
    },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: "Transactions", to: "/admin/transactions" }, { label: "Failed Payments" }]}>
      <h2 className="text-lg font-semibold text-foreground mb-4">Failed Payments</h2>
      <DataTable
        tableId="failed-payments"
        columns={columns}
        data={transactions}
        loading={loading}
        searchPlaceholder="Search by customer..."
        getRowId={(row) => row.id}
        emptyMessage="No failed payments"
      />

      <ConfirmModal
        open={Boolean(unlockTarget)}
        onOpenChange={() => setUnlockTarget(null)}
        title="Manually Unlock Template"
        description={`Unlock "${unlockTarget?.templateName}" for ${unlockTarget?.customerName} without payment?`}
        confirmLabel="Unlock Template"
        onConfirm={handleUnlock}
      >
        <div className="py-3 space-y-2">
          <Label>Reason (required)</Label>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g., payment failed but customer provided proof"
            className="min-h-[80px]"
          />
        </div>
      </ConfirmModal>
    </AdminLayout>
  );
};

export default FailedPayments;
