import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import DataTable, { Column, DataTableFilter } from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { adminApi } from "../services/api";
import { AdminTransaction, CURRENCY_SYMBOLS } from "../types";
import AdminLayout from "../components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAdminAuth();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState<AdminTransaction | null>(null);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    Promise.all([adminApi.getTransactions(), adminApi.getSettings()])
      .then(([txResponse, settings]) => {
        setTransactions(txResponse.transactions);
        setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? "$");
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (cents: number, currency?: string) => {
    const symbol = currency === "INR" ? "₹" : currencySymbol;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  const successTxns = useMemo(() => transactions.filter((txn) => txn.status === "success"), [transactions]);
  const totalRevenue = successTxns.reduce((sum, txn) => sum + txn.amount, 0);
  const totalRefunds = transactions
    .filter((txn) => txn.status === "refunded")
    .reduce((sum, txn) => sum + (txn.refundAmount || 0), 0);

  const handleRefund = async () => {
    if (!refundTarget) {
      return;
    }

    const amount = refundType === "full" ? refundTarget.amount : refundAmount;
    const reason =
      refundType === "full"
        ? "Full refund issued by admin"
        : `Partial refund requested: ${amount} cents`;

    try {
      await adminApi.refundTransaction(refundTarget.id, reason);
      setTransactions((previous) =>
        previous.map((txn) =>
          txn.id === refundTarget.id
            ? { ...txn, status: "refunded", refundAmount: amount }
            : txn,
        ),
      );
      setRefundTarget(null);
      toast({ title: `Refund of ${fmt(amount, refundTarget.currency)} issued` });
    } catch {
      toast({ title: "Refund failed", variant: "destructive" });
    }
  };

  const columns: Column<AdminTransaction>[] = [
    {
      key: "id",
      label: "ID",
      render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.id}</span>,
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (row) => (
        <button
          className="text-primary hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/admin/customers/${row.customerId}`);
          }}
        >
          {row.customerName}
        </button>
      ),
    },
    { key: "templateName", label: "Template", sortable: true },
    { key: "amount", label: "Amount", sortable: true, render: (row) => fmt(row.amount, row.currency) },
    { key: "date", label: "Date", sortable: true, render: (row) => format(new Date(row.date), "dd MMM yyyy") },
    { key: "status", label: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      label: "",
      hideable: false,
      render: (row) =>
        row.status === "success" && hasPermission("refund") ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={(event) => {
              event.stopPropagation();
              setRefundTarget(row);
              setRefundType("full");
              setRefundAmount(row.amount);
            }}
          >
            Refund
          </Button>
        ) : null,
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Success", value: "success" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
      ],
    },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: "Transactions" }]}>
      <h2 className="text-lg font-semibold text-foreground mb-4">All Transactions</h2>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border border-border rounded-md p-3 bg-card">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-600">{fmt(totalRevenue)}</p>
        </div>
        <div className="border border-border rounded-md p-3 bg-card">
          <p className="text-xs text-muted-foreground">Total Refunds</p>
          <p className="text-xl font-bold text-orange-500">{fmt(totalRefunds)}</p>
        </div>
        <div className="border border-border rounded-md p-3 bg-card">
          <p className="text-xs text-muted-foreground">Net Revenue</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalRevenue - totalRefunds)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/transactions/failed")}>
          View Failed Payments
        </Button>
      </div>

      <DataTable
        tableId="transactions"
        columns={columns}
        data={transactions}
        loading={loading}
        searchPlaceholder="Search by customer, ID..."
        filters={filters}
        getRowId={(row) => row.id}
        bulkActions={[{ label: "Export CSV", onClick: () => toast({ title: "CSV exported" }) }]}
        emptyMessage="No transactions found"
      />

      <ConfirmModal
        open={Boolean(refundTarget)}
        onOpenChange={() => setRefundTarget(null)}
        title="Issue Refund"
        description={`Refunding ${refundTarget?.customerName} for ${refundTarget?.templateName}`}
        confirmLabel={`Refund ${refundTarget ? fmt(refundType === "full" ? refundTarget.amount : refundAmount, refundTarget.currency) : ""}`}
        destructive
        onConfirm={handleRefund}
      >
        <div className="space-y-4 py-3">
          <div>
            <Label className="text-sm font-medium mb-2 block">Refund Amount</Label>
            <RadioGroup
              value={refundType}
              onValueChange={(value) => setRefundType(value as "full" | "partial")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="full" />
                <Label>Full ({refundTarget ? fmt(refundTarget.amount, refundTarget.currency) : ""})</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="partial" />
                <Label>Partial</Label>
              </div>
            </RadioGroup>
            {refundType === "partial" && (
              <Input
                type="number"
                value={refundAmount}
                onChange={(event) => setRefundAmount(Number(event.target.value))}
                max={refundTarget?.amount}
                className="mt-2 w-32"
              />
            )}
          </div>
        </div>
      </ConfirmModal>
    </AdminLayout>
  );
};

export default Transactions;
