"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  toggleCategory,
  updateCategory,
} from "@/services/api";

type Category = {
  _id: string;
  name: string;
  icon: string;
  subcategories: string[];
  active: boolean;
  createdAt: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

  const [name, setName] =
    useState("");

  const [icon, setIcon] =
    useState("tag");

  const [subcategories, setSubcategories] =
    useState("");

  async function loadCategories() {
    try {
      setLoading(true);

      const result =
        await getAdminCategories();

      setCategories(
        result?.data?.categories || []
      );
    } catch (error) {
      console.error(
        "Could not load categories:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setName("");
    setIcon("tag");
    setSubcategories("");
    setEditingId("");
    setShowForm(false);
  }

  function startCreate() {
    setName("");
    setIcon("tag");
    setSubcategories("");
    setEditingId("");
    setShowForm(true);
  }

  function startEdit(category: Category) {
    setEditingId(category._id);
    setName(category.name);
    setIcon(category.icon || "tag");

    setSubcategories(
      category.subcategories?.join(", ") || ""
    );

    setShowForm(true);
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!name.trim()) {
      alert(
        "Category name is required."
      );

      return;
    }

    const subcategoryArray =
      subcategories
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    try {
      setActionId(
        editingId || "create"
      );

      if (editingId) {
        await updateCategory(
          editingId,
          {
            name: name.trim(),
            icon:
              icon.trim() || "tag",
            subcategories:
              subcategoryArray,
          }
        );
      } else {
        await createCategory({
          name: name.trim(),
          icon:
            icon.trim() || "tag",
          subcategories:
            subcategoryArray,
        });
      }

      resetForm();

      await loadCategories();
    } catch (error: any) {
      alert(
        error?.message ||
          "Could not save category."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleToggle(
    id: string
  ) {
    try {
      setActionId(id);

      await toggleCategory(id);

      await loadCategories();
    } catch (error: any) {
      alert(
        error?.message ||
          "Could not change category status."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(
    category: Category
  ) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setActionId(category._id);

      await deleteCategory(
        category._id
      );

      await loadCategories();
    } catch (error: any) {
      alert(
        error?.message ||
          "Could not delete category."
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <AdminShell>
      <div className="page-header">
        <div>
          <h1>
            Categories
          </h1>

          <p>
            Create and manage marketplace
            categories.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            className="refresh-button"
            onClick={loadCategories}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            className="approve-button"
            onClick={startCreate}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* =====================================================
          CREATE / EDIT FORM
      ===================================================== */}

      {showForm && (
        <div
          className="listing-table-card"
          style={{
            marginBottom: "24px",
            padding: "24px",
          }}
        >
          <div className="table-header">
            <strong>
              {editingId
                ? "Edit Category"
                : "Create Category"}
            </strong>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Category Name
              </label>

              <input
                className="search-input"
                style={{
                  width: "100%",
                }}
                placeholder="Example: Electronics"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Icon
              </label>

              <input
                className="search-input"
                style={{
                  width: "100%",
                }}
                placeholder="Example: smartphone"
                value={icon}
                onChange={(event) =>
                  setIcon(
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                Subcategories
              </label>

              <input
                className="search-input"
                style={{
                  width: "100%",
                }}
                placeholder="Phones, Laptops, Tablets"
                value={subcategories}
                onChange={(event) =>
                  setSubcategories(
                    event.target.value
                  )
                }
              />

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                }}
              >
                Separate each
                subcategory with a
                comma.
              </small>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="submit"
                className="approve-button"
                disabled={
                  actionId ===
                  (editingId ||
                    "create")
                }
              >
                {actionId ===
                (editingId ||
                  "create")
                  ? "Saving..."
                  : editingId
                  ? "Update Category"
                  : "Create Category"}
              </button>

              <button
                type="button"
                className="reject-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================
          CATEGORY LIST
      ===================================================== */}

      {loading ? (
        <div className="empty-card">
          <div className="spinner" />

          <p>
            Loading categories...
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">
            🏷️
          </div>

          <h2>
            No categories found
          </h2>

          <p>
            Create your first marketplace
            category.
          </p>
        </div>
      ) : (
        <div className="listing-table-card">
          <div className="table-header">
            <strong>
              {categories.length} categories
            </strong>
          </div>

          <div className="listing-table">
            {categories.map(
              (category) => {
                const busy =
                  actionId ===
                  category._id;

                return (
                  <div
                    className="listing-row"
                    key={category._id}
                  >
                    <div className="listing-image">
                      <span>
                        🏷️
                      </span>
                    </div>

                    <div className="listing-info">
                      <h3>
                        {category.name}
                      </h3>

                      <p className="listing-meta">
                        Icon:{" "}
                        {category.icon ||
                          "tag"}
                      </p>

                      {category
                        .subcategories
                        ?.length >
                        0 && (
                        <p className="listing-meta">
                          {
                            category
                              .subcategories
                              .length
                          }{" "}
                          subcategories
                        </p>
                      )}

                      {category
                        .subcategories
                        ?.length >
                        0 && (
                        <p className="listing-meta">
                          {category.subcategories.join(
                            " · "
                          )}
                        </p>
                      )}
                    </div>

                    <div className="listing-status">
                      <span
                        className={
                          category.active
                            ? "status status-active"
                            : "status status-suspended"
                        }
                      >
                        {category.active
                          ? "active"
                          : "inactive"}
                      </span>

                      <small>
                        {new Date(
                          category.createdAt
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </small>
                    </div>

                    <div className="listing-actions">
                      <button
                        className="approve-button"
                        disabled={busy}
                        onClick={() =>
                          startEdit(
                            category
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className={
                          category.active
                            ? "reject-button"
                            : "approve-button"
                        }
                        disabled={busy}
                        onClick={() =>
                          handleToggle(
                            category._id
                          )
                        }
                      >
                        {busy
                          ? "..."
                          : category.active
                          ? "Disable"
                          : "Enable"}
                      </button>

                      <button
                        className="reject-button"
                        disabled={busy}
                        onClick={() =>
                          handleDelete(
                            category
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}