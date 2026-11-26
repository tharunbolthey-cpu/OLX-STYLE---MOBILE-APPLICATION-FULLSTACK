
"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logout, me } from "@/services/api";

type Props = {
  children: ReactNode;
};

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function AdminShell({
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] =
    useState<AdminUser | null>(null);

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const result = await me();

        const currentUser =
          result?.data?.user;

        if (
          !currentUser ||
          currentUser.role !== "admin"
        ) {
          router.replace("/login");
          return;
        }

        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error(
          "Admin authentication failed:",
          error
        );

        router.replace("/login");
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="spinner" />

        <p>
          Checking admin access...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">
          <div className="brand-logo">
            M
          </div>

          <div>
            <strong>
              Marketly
            </strong>

            <span>
              Admin
            </span>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav>

          {/* Dashboard */}

          <Link
            href="/dashboard"
            className={
              pathname === "/dashboard"
                ? "nav-active"
                : ""
            }
          >
            <span>📊</span>

            <span>
              Dashboard
            </span>
          </Link>

          {/* Listings */}

          <Link
            href="/listings"
            className={
              pathname.startsWith("/listings")
                ? "nav-active"
                : ""
            }
          >
            <span>📦</span>

            <span>
              Listings
            </span>
          </Link>

          {/* Reports */}

          <Link
            href="/reports"
            className={
              pathname.startsWith("/reports")
                ? "nav-active"
                : ""
            }
          >
            <span>🚨</span>

            <span>
              Reports
            </span>
          </Link>

          {/* Users */}

          <Link
            href="/users"
            className={
              pathname.startsWith("/users")
                ? "nav-active"
                : ""
            }
          >
            <span>👥</span>

            <span>
              Users
            </span>
          </Link>

          {/* Categories */}

          <Link
            href="/categories"
            className={
              pathname.startsWith(
                "/categories"
              )
                ? "nav-active"
                : ""
            }
          >
            <span>🏷️</span>

            <span>
              Categories
            </span>
          </Link>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          {/* ADMIN USER */}

          <div className="admin-user">

            <div className="avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "A"}
            </div>

            <div>
              <strong>
                {user?.name ||
                  "Administrator"}
              </strong>

              <span>
                {user?.email || ""}
              </span>
            </div>

          </div>

          {/* LOGOUT */}

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>🚪</span>

            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="admin-main">
        {children}
      </main>

    </div>
  );
}

