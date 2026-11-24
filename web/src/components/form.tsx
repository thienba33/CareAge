"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { ActionState } from "@/lib/actions";

// Ô nhập / nút dùng chung cho các form quản trị.

const FIELD = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${FIELD} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD} min-h-24 ${props.className ?? ""}`} />;
}

export function SubmitButton({
  pending,
  children,
  tone = "primary",
}: {
  pending: boolean;
  children: ReactNode;
  tone?: "primary" | "danger";
}) {
  const color = tone === "danger" ? "bg-danger hover:bg-red-700" : "bg-primary hover:bg-primary-dark";
  return (
    <button type="submit" disabled={pending} className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${color}`}>
      {pending ? "Đang xử lý…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  return (
    <p className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-primary-light text-primary-dark" : "bg-danger-light text-danger"}`}>
      {state.message}
    </p>
  );
}
