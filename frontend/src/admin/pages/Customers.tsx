import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable, { Column, DataTableFilter } from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { adminApi } from "../services/api";
import { AdminCustomer, CURRENCY_SYMBOLS } from "../types";
import AdminLayout from "../components/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    Promise.all([adminApi.getCustomers(), adminApi.getSettings()])
      .then(([customerResponse, settings]) => {
        setCustomers(customerResponse.customers);
        setCurrencySymbol(CURRENCY_SYMBOLS[settings.currency] ?? "$");
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (cents: number) => `${currencySymbol}${(cents / 100).toFixed(2)}`;

  const columns: Column<AdminCustomer>[] = [
    { key: "name", label: "Name", sortable: true, render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
    { key: "email", label: "Email", sortable: true, render: (row) => <span className="text-muted-foreground">{row.email}</span> },
    { key: "joinDate", label: "Joined", sortable: true, render: (row) => format(new Date(row.joinDate), "dd MMM yyyy") },
    { key: "totalInvites", label: "Invites", sortable: true },
    { key: "totalSpent", label: "Spent", sortable: true, render: (row) => fmt(row.totalSpent) },
    { key: "status", label: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: "lastActive", label: "Last Active", sortable: true, render: (row) => format(new Date(row.lastActive), "dd MMM") },
  ];

  const filters: DataTableFilter[] = [
    { key: "status", label: "Status", options: [{ label: "Active", value: "active" }, { label: "Suspended", value: "suspended" }] },
    { key: "plan", label: "Plan", options: [{ label: "Free", value: "free" }, { label: "Premium", value: "premium" }] },
  ];

  return (
    <AdminLayout breadcrumbs={[{ label: "Customers" }]}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">All Customers</h2>
        <Button size="sm" onClick={() => navigate("/admin/customers/new")}>
          <Plus className="h-4 w-4 mr-1" /> Add Customer
        </Button>
      </div>
      <DataTable
        tableId="customers"
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search by name or email..."
        filters={filters}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
        bulkActions={[
          { label: "Export CSV", onClick: () => toast({ title: "CSV exported" }) },
          { label: "Suspend", onClick: () => toast({ title: "Bulk suspend not implemented in demo" }), destructive: true },
        ]}
        emptyMessage="No customers found"
      />
    </AdminLayout>
  );
};

export default Customers;
