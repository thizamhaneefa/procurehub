"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#3a0a22] via-[#7a1741] to-[#b91456] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-600/40">
            <Container size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">ProcureHub</h1>
          <p className="mt-1 text-sm text-pink-100/80">Procurement & Inventory Control Panel</p>
        </div>

        <form onSubmit={submit} className="card !border-pink-300/20 !bg-[#2b0a1a]/80 p-6 backdrop-blur">
          <div className="mb-4">
            <label className="label !text-pink-200/80">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300/60" />
              <input className="input !border-pink-300/20 !bg-[#1f0c16] pl-9 !text-white" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="mb-6">
            <label className="label !text-pink-200/80">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-300/60" />
              <input type="password" className="input !border-pink-300/20 !bg-[#1f0c16] pl-9 !text-white" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="mt-4 text-center text-xs text-pink-200/60">Demo login: admin / admin123</p>
        </form>
      </div>
    </div>
  );
}
