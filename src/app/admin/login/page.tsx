"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        setError(data.error ?? "Неуспешен вход.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setStatus("error");
      setError("Нещо се обърка. Опитай отново.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lavender-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-lavender-200 bg-paper-50 p-8">
        <h1 className="text-xl font-semibold text-ink-900">Админ вход</h1>
        <InputField
          label="Потребителско име"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />
        <InputField
          label="Парола"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        {error ? (
          <p role="alert" className="text-sm text-burgundy-600">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={status === "submitting"} className="w-full">
          {status === "submitting" ? "Влизане…" : "Влез"}
        </Button>
      </form>
    </div>
  );
}
