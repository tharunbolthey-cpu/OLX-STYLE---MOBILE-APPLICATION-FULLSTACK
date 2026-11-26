"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  approveListing,
  getAdminListings,
  rejectListing,
} from "@/services/api";
import { Listing } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

function getImageUrl(path?: string) {
  if (!path) return "";

  const baseUrl = API_URL.replace(/\/api\/?$/, "");

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    try {
      const url = new URL(path);

      return `${baseUrl}${url.pathname}${url.search}`;
    } catch {
      return path;
    }
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadListings() {
    try {
      setLoading(true);

      const result = await getAdminListings();

      setListings(result?.data?.listings || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  async function handleApprove(id: string) {
    try {
      setActionId(id);

      await approveListing(id);

      await loadListings();
    } catch (error: any) {
      alert(error.message || "Could not approve listing.");
    } finally {
      setActionId("");
    }
  }

  async function handleReject(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this listing?"
    );

    if (!confirmed) return;

    try {
      setActionId(id);

      await rejectListing(id);

      await loadListings();
    } catch (error: any) {
      alert(error.message || "Could not reject listing.");
    } finally {
      setActionId("");
    }
  }

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesStatus =
        filter === "all" || listing.status === filter;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query) ||
        listing.seller?.name?.toLowerCase().includes(query) ||
        listing.seller?.email?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [listings, filter, search]);

  return (
    <AdminShell>
      <div className="page-header">
        <div>
          <h1>Listings</h1>
          <p>Review and manage marketplace advertisements.</p>
        </div>

        <button className="refresh-button" onClick={loadListings}>
          ↻ Refresh
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search listings, sellers or locations..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All listings</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="sold">Sold</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-card">
          <div className="spinner" />
          <p>Loading listings...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">📦</div>
          <h2>No listings found</h2>
          <p>
            There are no listings matching your current filters.
          </p>
        </div>
      ) : (
        <div className="listing-table-card">
          <div className="table-header">
            <strong>{filteredListings.length} listings</strong>
          </div>

          <div className="listing-table">
            {filteredListings.map((listing) => {
              const busy = actionId === listing._id;

              return (
                <div
                  className="listing-row"
                  key={listing._id}
                >
                  <div className="listing-image">
                    {listing.images?.[0] ? (
                      <img
                        src={getImageUrl(listing.images[0])}
                        alt={listing.title}
                      />
                    ) : (
                      <span>📷</span>
                    )}
                  </div>

                  <div className="listing-info">
                    <h3>{listing.title}</h3>

                    <p className="listing-price">
                      ₹{Number(listing.price).toLocaleString("en-IN")}
                    </p>

                    <p className="listing-meta">
                      {listing.location} · {listing.condition}
                    </p>

                    <p className="seller">
                      Seller:{" "}
                      <strong>
                        {listing.seller?.name || "Unknown"}
                      </strong>
                      {listing.seller?.email
                        ? ` · ${listing.seller.email}`
                        : ""}
                    </p>
                  </div>

                  <div className="listing-status">
                    <span
                      className={`status status-${listing.status}`}
                    >
                      {listing.status}
                    </span>

                    <small>
                      {new Date(
                        listing.createdAt
                      ).toLocaleDateString("en-IN")}
                    </small>
                  </div>

                  <div className="listing-actions">
                    {listing.status === "pending" && (
                      <>
                        <button
                          className="approve-button"
                          disabled={busy}
                          onClick={() =>
                            handleApprove(listing._id)
                          }
                        >
                          {busy ? "..." : "Approve"}
                        </button>

                        <button
                          className="reject-button"
                          disabled={busy}
                          onClick={() =>
                            handleReject(listing._id)
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {listing.status === "active" && (
                      <span className="live-label">Live</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminShell>
  );
}