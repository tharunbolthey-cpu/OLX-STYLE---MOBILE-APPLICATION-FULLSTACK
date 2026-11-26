const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   BASE API
========================================================= */

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    }
  );

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   AUTHENTICATION
========================================================= */

export async function login(
  email: string,
  password: string
) {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function me() {
  return api("/auth/me");
}

export async function logout() {
  return api("/auth/logout", {
    method: "POST",
  });
}

/* =========================================================
   DASHBOARD
========================================================= */

export async function getStats() {
  return api("/admin/stats");
}

/* =========================================================
   LISTINGS
========================================================= */

export async function getAdminListings() {
  return api("/listings/admin/all");
}

export async function approveListing(
  id: string
) {
  return api(`/listings/${id}/approve`, {
    method: "POST",
  });
}

export async function rejectListing(
  id: string
) {
  return api(`/listings/${id}/reject`, {
    method: "POST",
  });
}

/* =========================================================
   USER MANAGEMENT
========================================================= */

export async function getAdminUsers(
  search = "",
  status = "",
  role = ""
) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status) {
    params.set("status", status);
  }

  if (role) {
    params.set("role", role);
  }

  const query = params.toString();

  return api(
    `/admin/users${
      query ? `?${query}` : ""
    }`
  );
}

export async function getAdminUser(
  id: string
) {
  return api(`/admin/users/${id}`);
}

export async function suspendUser(
  id: string
) {
  return api(
    `/admin/users/${id}/suspend`,
    {
      method: "PATCH",
    }
  );
}

export async function activateUser(
  id: string
) {
  return api(
    `/admin/users/${id}/activate`,
    {
      method: "PATCH",
    }
  );
}

export async function deleteUser(
  id: string
) {
  return api(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

/* =========================================================
   CATEGORY MANAGEMENT
========================================================= */

export async function getAdminCategories() {
  return api("/admin/categories");
}

export async function getAdminCategory(
  id: string
) {
  return api(`/admin/categories/${id}`);
}

export async function createCategory(data: {
  name: string;
  icon?: string;
  subcategories?: string[];
  active?: boolean;
}) {
  return api("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    icon?: string;
    subcategories?: string[];
    active?: boolean;
  }
) {
  return api(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(
  id: string
) {
  return api(`/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export async function toggleCategory(
  id: string
) {
  return api(
    `/admin/categories/${id}/toggle`,
    {
      method: "PATCH",
    }
  );
}
export async function getReports() {
  return api("/reports");
}

export async function updateReport(
  id: string,
  status: "open" | "dismissed" | "resolved"
) {
  return api(`/reports/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}