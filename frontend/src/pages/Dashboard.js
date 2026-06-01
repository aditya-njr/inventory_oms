import React, { useCallback, useEffect, useState } from "react";
import { dashboardApi } from "../api/client";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import { useToast } from "../components/Toast";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await dashboardApi.summary();
      setSummary(data);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const lowStockColumns = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    {
      key: "quantity_in_stock",
      label: "Stock",
      render: (row) => (
        <span
          className={
            row.quantity_in_stock <= 5
              ? "badge badge-danger"
              : "badge badge-warning"
          }
        >
          {row.quantity_in_stock}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div className="page-loading">Loading dashboard...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview of your inventory and orders</p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Products"
          value={summary?.total_products ?? 0}
          accent="blue"
        />
        <StatCard
          label="Total Customers"
          value={summary?.total_customers ?? 0}
          accent="green"
        />
        <StatCard
          label="Total Orders"
          value={summary?.total_orders ?? 0}
          accent="purple"
        />
        <StatCard
          label="Low Stock Items"
          value={summary?.low_stock_products?.length ?? 0}
          accent="orange"
        />
      </div>

      <section className="card">
        <div className="card-header">
          <h2>Low Stock Products</h2>
          <span className="badge badge-muted">Threshold: 5 units</span>
        </div>
        <DataTable
          columns={lowStockColumns}
          data={summary?.low_stock_products ?? []}
          emptyMessage="All products are well stocked."
        />
      </section>
    </div>
  );
}

export default Dashboard;
