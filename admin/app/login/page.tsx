"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, me } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setBusy(true);

      const result = await login(email.trim(), password);

      const user = result?.data?.user;

      if (!user || user.role !== "admin") {
        throw new Error("This account does not have admin access.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="brand">
          <div className="brand-logo">M</div>

          <div>
            <h1>Marketly</h1>
            <p>Admin Panel</p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to manage your marketplace.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {error && <div className="error-box">{error}</div>}

          <button type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}