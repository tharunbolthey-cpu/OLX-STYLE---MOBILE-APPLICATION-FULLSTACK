"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/services/api";
import AdminShell from "@/components/AdminShell";
import { Stats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      const result = await getStats();
      setStats(result?.data?.stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <AdminShell>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your Marketly marketplace.</p>
        </div>

        <button className="refresh-button" onClick={loadStats}>
          ↻ Refresh
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={loading ? "—" : stats?.users ?? 0}
          icon="👥"
        />

        <StatCard
          title="Total Listings"
          value={loading ? "—" : stats?.listings ?? 0}
          icon="📦"
        />

        <StatCard
          title="Active Listings"
          value={loading ? "—" : stats?.active ?? 0}
          icon="✅"
        />

        <StatCard
          title="Pending Approval"
          value={loading ? "—" : stats?.pending ?? 0}
          icon="⏳"
          highlight
        />

        <StatCard
          title="Sold"
          value={loading ? "—" : stats?.sold ?? 0}
          icon="💰"
        />

        <StatCard
          title="Open Reports"
          value={loading ? "—" : stats?.reports ?? 0}
          icon="🚨"
        />
      </div>

      <div className="dashboard-card">
        <div>
          <h2>Pending approvals</h2>
          <p>
            There are currently{" "}
            <strong>{stats?.pending ?? 0}</strong> listings waiting for review.
          </p>
        </div>

        <a href="/listings?status=pending" className="primary-link">
          Review listings →
        </a>
      </div>
    </AdminShell>
  );
}

function StatCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: number | string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card ${highlight ? "stat-highlight" : ""}`}>
      <div className="stat-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}