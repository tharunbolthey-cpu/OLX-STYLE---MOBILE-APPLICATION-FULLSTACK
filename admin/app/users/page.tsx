"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  activateUser,
  deleteUser,
  getAdminUsers,
  suspendUser,
} from "@/services/api";

type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  location?: string;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [actionId, setActionId] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);

      const result = await getAdminUsers(
        "",
        statusFilter === "all" ? "" : statusFilter,
        roleFilter === "all" ? "" : roleFilter
      );

      setUsers(result?.data?.users || []);
    } catch (error) {
      console.error("Could not load users:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [statusFilter, roleFilter]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.location?.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  async function handleSuspend(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to suspend this user?"
    );

    if (!confirmed) return;

    try {
      setActionId(id);

      await suspendUser(id);

      await loadUsers();
    } catch (error: any) {
      alert(
        error?.message ||
          "Could not suspend the user."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleActivate(id: string) {
    try {
      setActionId(id);

      await activateUser(id);

      await loadUsers();
    } catch (error: any) {
      alert(
        error?.message ||
          "Could not activate the user."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "This will permanently delete this user and all listings belonging to this user. Continue?"
    );

    if (!confirmed) return;

    try {
      setActionId(id);

      await deleteUser(id);

      await loadUsers();
    } catch (error: any) {
      alert(
        error?.message ||
          "Could not delete the user."
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <AdminShell>
      <div className="page-header">
        <div>
          <h1>Users</h1>

          <p>
            Manage Marketly users and their
            account status.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadUsers}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search name, email, phone or location..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="suspended">
            Suspended
          </option>
        </select>

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(event.target.value)
          }
        >
          <option value="all">
            All roles
          </option>

          <option value="user">
            Users
          </option>

          <option value="admin">
            Admins
          </option>
        </select>
      </div>

      {loading ? (
        <div className="empty-card">
          <div className="spinner" />

          <p>
            Loading users...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">
            👥
          </div>

          <h2>
            No users found
          </h2>

          <p>
            There are no users matching
            your current filters.
          </p>
        </div>
      ) : (
        <div className="listing-table-card">
          <div className="table-header">
            <strong>
              {filteredUsers.length} users
            </strong>
          </div>

          <div className="listing-table">
            {filteredUsers.map((user) => {
              const busy =
                actionId === user._id;

              return (
                <div
                  className="listing-row"
                  key={user._id}
                >
                  <div className="listing-image">
                    <span>
                      {user.role === "admin"
                        ? "🛡️"
                        : "👤"}
                    </span>
                  </div>

                  <div className="listing-info">
                    <h3>
                      {user.name}
                    </h3>

                    <p className="listing-meta">
                      ✉️ {user.email}
                    </p>

                    <p className="listing-meta">
                      📱 {user.phone}
                    </p>

                    {user.location && (
                      <p className="listing-meta">
                        📍 {user.location}
                      </p>
                    )}
                  </div>

                  <div className="listing-status">
                    <span
                      className={`status status-${user.status}`}
                    >
                      {user.status}
                    </span>

                    <small>
                      Role: {user.role}
                    </small>

                    <small>
                      Joined:{" "}
                      {new Date(
                        user.createdAt
                      ).toLocaleDateString(
                        "en-IN"
                      )}
                    </small>
                  </div>

                  <div className="listing-actions">
                    {user.role !== "admin" && (
                      <>
                        {user.status ===
                        "active" ? (
                          <button
                            className="reject-button"
                            disabled={busy}
                            onClick={() =>
                              handleSuspend(
                                user._id
                              )
                            }
                          >
                            {busy
                              ? "..."
                              : "Suspend"}
                          </button>
                        ) : (
                          <button
                            className="approve-button"
                            disabled={busy}
                            onClick={() =>
                              handleActivate(
                                user._id
                              )
                            }
                          >
                            {busy
                              ? "..."
                              : "Activate"}
                          </button>
                        )}

                        <button
                          className="reject-button"
                          disabled={busy}
                          onClick={() =>
                            handleDelete(
                              user._id
                            )
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {user.role === "admin" && (
                      <span className="live-label">
                        Admin
                      </span>
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