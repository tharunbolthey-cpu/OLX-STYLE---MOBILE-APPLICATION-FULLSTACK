"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { getReports, updateReport } from "@/services/api";

type Report = {
  _id: string;
  reason: string;
  description?: string;
  status: "open" | "dismissed" | "resolved";
  createdAt: string;
  reporter?: {
    _id: string;
    name: string;
    email: string;
  };
  listing?: {
    _id: string;
    title: string;
    price?: number;
    location?: string;
    seller?: {
      _id: string;
      name: string;
    };
  };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  async function loadReports() {
    try {
      setLoading(true);

      const result = await getReports();

      setReports(result?.data?.reports || []);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function changeStatus(
    id: string,
    status: "dismissed" | "resolved"
  ) {
    try {
      setUpdating(id);

      await updateReport(id, status);

      await loadReports();
    } catch (error) {
      console.error("Failed to update report:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Could not update report"
      );
    } finally {
      setUpdating(null);
    }
  }

  const filteredReports =
    filter === "all"
      ? reports
      : reports.filter((report) => report.status === filter);

  const openCount = reports.filter(
    (report) => report.status === "open"
  ).length;

  const resolvedCount = reports.filter(
    (report) => report.status === "resolved"
  ).length;

  const dismissedCount = reports.filter(
    (report) => report.status === "dismissed"
  ).length;

  return (
    <AdminShell>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>
            Review reports submitted by Marketly users.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadReports}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-highlight">
          <div className="stat-icon">🚨</div>

          <div>
            <p>Open Reports</p>
            <strong>{openCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>

          <div>
            <p>Resolved</p>
            <strong>{resolvedCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✖️</div>

          <div>
            <p>Dismissed</p>
            <strong>{dismissedCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>

          <div>
            <p>Total Reports</p>
            <strong>{reports.length}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="filter-row">
          <button
            className={filter === "all" ? "filter-active" : "filter-button"}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={
              filter === "open"
                ? "filter-active"
                : "filter-button"
            }
            onClick={() => setFilter("open")}
          >
            Open
          </button>

          <button
            className={
              filter === "resolved"
                ? "filter-active"
                : "filter-button"
            }
            onClick={() => setFilter("resolved")}
          >
            Resolved
          </button>

          <button
            className={
              filter === "dismissed"
                ? "filter-active"
                : "filter-button"
            }
            onClick={() => setFilter("dismissed")}
          >
            Dismissed
          </button>
        </div>
      </div>

      <div className="reports-list">
        {loading ? (
          <div className="dashboard-card">
            <p>Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="dashboard-card empty-state">
            <div className="empty-icon">🎉</div>

            <h2>No reports found</h2>

            <p>
              There are no reports in this section.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report._id}
              className="report-card"
            >
              <div className="report-header">
                <div>
                  <span
                    className={`status-badge status-${report.status}`}
                  >
                    {report.status}
                  </span>

                  <h2>{report.reason}</h2>

                  <p className="report-date">
                    Reported{" "}
                    {new Date(
                      report.createdAt
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="report-id">
                  #{report._id.slice(-6)}
                </div>
              </div>

              <div className="report-grid">
                <div className="report-section">
                  <h3>Reported Listing</h3>

                  {report.listing ? (
                    <>
                      <strong>
                        {report.listing.title}
                      </strong>

                      {report.listing.price !== undefined && (
                        <p>
                          ₹
                          {Number(
                            report.listing.price
                          ).toLocaleString("en-IN")}
                        </p>
                      )}

                      {report.listing.location && (
                        <p>
                          📍 {report.listing.location}
                        </p>
                      )}

                      {report.listing.seller && (
                        <p>
                          Seller:{" "}
                          <strong>
                            {report.listing.seller.name}
                          </strong>
                        </p>
                      )}
                    </>
                  ) : (
                    <p>Listing no longer exists.</p>
                  )}
                </div>

                <div className="report-section">
                  <h3>Reported By</h3>

                  {report.reporter ? (
                    <>
                      <strong>
                        {report.reporter.name}
                      </strong>

                      <p>
                        {report.reporter.email}
                      </p>
                    </>
                  ) : (
                    <p>Unknown user</p>
                  )}
                </div>

                <div className="report-section">
                  <h3>Reason</h3>

                  <p>{report.reason}</p>
                </div>
              </div>

              {report.description && (
                <div className="report-description">
                  <h3>Additional Details</h3>

                  <p>{report.description}</p>
                </div>
              )}

              {report.status === "open" && (
                <div className="report-actions">
                  <button
                    className="dismiss-button"
                    disabled={updating === report._id}
                    onClick={() =>
                      changeStatus(
                        report._id,
                        "dismissed"
                      )
                    }
                  >
                    {updating === report._id
                      ? "Updating..."
                      : "Dismiss Report"}
                  </button>

                  <button
                    className="resolve-button"
                    disabled={updating === report._id}
                    onClick={() =>
                      changeStatus(
                        report._id,
                        "resolved"
                      )
                    }
                  >
                    {updating === report._id
                      ? "Updating..."
                      : "Resolve Report"}
                  </button>
                </div>
              )}

              {report.status !== "open" && (
                <div className="report-actions">
                  <span className="completed-message">
                    This report has been {report.status}.
                  </span>

                  <button
                    className="reopen-button"
                    disabled={updating === report._id}
                    onClick={async () => {
                      try {
                        setUpdating(report._id);

                        await updateReport(
                          report._id,
                          "open"
                        );

                        await loadReports();
                      } catch (error) {
                        console.error(
                          "Failed to reopen report:",
                          error
                        );
                      } finally {
                        setUpdating(null);
                      }
                    }}
                  >
                    Reopen
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .filter-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-button,
        .filter-active {
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 10px;
          padding: 9px 15px;
          background: white;
          cursor: pointer;
          font-weight: 700;
        }

        .filter-active {
          background: #111827;
          color: white;
          border-color: #111827;
        }

        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 18px;
        }

        .report-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          border-bottom: 1px solid #eef0f3;
          padding-bottom: 16px;
        }

        .report-header h2 {
          margin: 9px 0 4px;
          font-size: 19px;
        }

        .report-date {
          margin: 0;
          color: #667085;
          font-size: 12px;
        }

        .report-id {
          color: #98a2b3;
          font-size: 12px;
          font-family: monospace;
        }

        .status-badge {
          display: inline-flex;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .status-open {
          background: #fff4e5;
          color: #b54708;
        }

        .status-resolved {
          background: #ecfdf3;
          color: #027a48;
        }

        .status-dismissed {
          background: #f2f4f7;
          color: #475467;
        }

        .report-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          padding: 20px 0;
        }

        .report-section {
          background: #f8fafc;
          border-radius: 13px;
          padding: 15px;
        }

        .report-section h3,
        .report-description h3 {
          margin: 0 0 8px;
          font-size: 12px;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .report-section p {
          margin: 6px 0;
          color: #475467;
          font-size: 13px;
        }

        .report-description {
          background: #fff8f8;
          border: 1px solid #fee4e2;
          border-radius: 13px;
          padding: 15px;
        }

        .report-description p {
          margin: 0;
          color: #344054;
          line-height: 1.6;
          font-size: 14px;
        }

        .report-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .dismiss-button,
        .resolve-button,
        .reopen-button {
          border-radius: 10px;
          padding: 10px 15px;
          cursor: pointer;
          font-weight: 800;
          border: 1px solid #e5e7eb;
        }

        .dismiss-button {
          background: white;
          color: #475467;
        }

        .resolve-button {
          background: #111827;
          color: white;
          border-color: #111827;
        }

        .reopen-button {
          background: white;
          color: #175cd3;
        }

        .dismiss-button:disabled,
        .resolve-button:disabled,
        .reopen-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .completed-message {
          margin-right: auto;
          color: #667085;
          font-size: 13px;
        }

        .empty-state {
          text-align: center;
          padding: 50px 20px;
        }

        .empty-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }

        .empty-state h2 {
          margin: 0 0 5px;
        }

        .empty-state p {
          color: #667085;
        }

        @media (max-width: 900px) {
          .report-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .report-card {
            padding: 15px;
          }

          .report-header {
            flex-direction: column;
          }

          .report-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .completed-message {
            margin-right: 0;
          }
        }
      `}</style>
    </AdminShell>
  );
}