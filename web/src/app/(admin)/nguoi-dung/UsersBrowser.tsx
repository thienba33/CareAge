"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowDownUp, Lock, Search, UserRound, X } from "lucide-react";
import { Avatar, Badge, Content } from "@/components/ui";
import { formatDate, ROLE_LABEL, type Role } from "@/lib/labels";
import { ROLE_STYLE } from "@/lib/roleStyle";
import type { UserRow } from "@/lib/data";
import UserActions from "./UserActions";

const ROLES: Role[] = ["ELDERLY", "CAREGIVER", "MEDICAL_STAFF", "ADMIN"];
const PAGE_SIZE = 30;

type Sort = "newest" | "oldest" | "name";
// Bộ lọc: một vai trò, "LOCKED" (tài khoản đã khoá) hoặc null (tất cả).
type Filter = Role | "LOCKED" | null;
const SORT_LABEL: Record<Sort, string> = { newest: "Mới nhất", oldest: "Cũ nhất", name: "Tên A–Z" };

// Bỏ dấu tiếng Việt để tìm "tam" ra "Tám".
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

// Tên gọi (từ cuối) để sắp xếp A–Z theo kiểu Việt Nam.
const givenName = (name: string) => normalize(name.trim().split(/\s+/).pop() ?? name);

// Giữ bộ lọc trên URL (chia sẻ / tải lại vẫn đúng) mà không gọi lại server.
function syncUrl(role: Filter, q: string) {
  const sp = new URLSearchParams();
  if (role) sp.set("vai-tro", role);
  if (q.trim()) sp.set("q", q.trim());
  const s = sp.toString();
  window.history.replaceState(null, "", `/nguoi-dung${s ? `?${s}` : ""}`);
}

export default function UsersBrowser({
  users,
  currentAdminId,
  initialRole,
  initialQuery,
}: {
  users: UserRow[];
  currentAdminId: string;
  initialRole: Role | null;
  initialQuery: string;
}) {
  const [role, setRole] = useState<Filter>(initialRole);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("newest");
  const [limit, setLimit] = useState(PAGE_SIZE);
  // Gõ phím không bị khựng: danh sách lọc theo giá trị "trễ" một nhịp khi danh sách dài.
  const deferredQuery = useDeferredValue(query);

  const counts = useMemo(() => {
    const c: Record<Role, number> = { ELDERLY: 0, CAREGIVER: 0, MEDICAL_STAFF: 0, ADMIN: 0 };
    users.forEach((u) => (c[u.role] += 1));
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery);
    const list = users.filter(
      (u) =>
        (!role || (role === "LOCKED" ? !!u.locked_at : u.role === role)) &&
        (!q || normalize(u.name).includes(q) || normalize(u.code).includes(q) || normalize(u.email).includes(q) || (u.phone ?? "").includes(q))
    );
    return list.sort((a, b) =>
      sort === "name"
        ? givenName(a.name).localeCompare(givenName(b.name), "vi")
        : sort === "oldest"
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at)
    );
  }, [users, role, deferredQuery, sort]);

  const visible = filtered.slice(0, limit);
  const isStale = deferredQuery !== query;

  const pickRole = (r: Filter) => {
    setRole(r);
    setLimit(PAGE_SIZE);
    syncUrl(r, query);
  };
  const changeQuery = (q: string) => {
    setQuery(q);
    setLimit(PAGE_SIZE);
    syncUrl(role, q);
  };

  const lockedCount = users.filter((u) => u.locked_at).length;
  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: null, label: "Tất cả", count: users.length },
    ...ROLES.map((r) => ({ key: r, label: ROLE_LABEL[r], count: counts[r] })),
    ...(lockedCount > 0 ? [{ key: "LOCKED" as const, label: "Đã khoá", count: lockedCount }] : []),
  ];

  return (
    <Content overlap>
      {/* Một thẻ duy nhất: thanh công cụ (tìm + sắp xếp), lọc vai trò, rồi bảng thẳng cột. */}
      {/* Không dùng overflow-hidden: menu ⋮ của hàng cuối phải tràn ra ngoài thẻ được. */}
      <section className="card">
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-line px-3.5 transition focus-within:border-primary">
            <Search aria-hidden className="size-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Tìm theo tên, mã (ELD001), email hoặc SĐT"
              aria-label="Tìm người dùng"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
            />
            {query ? (
              <button onClick={() => changeQuery("")} aria-label="Xoá tìm kiếm" className="rounded-full p-1 text-muted hover:bg-line/60 hover:text-ink">
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-line px-3">
            <ArrowDownUp aria-hidden className="size-4 text-muted" />
            <span className="text-sm text-muted">Sắp xếp</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent py-2 text-sm text-ink outline-none">
              {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4">
          <div role="tablist" aria-label="Lọc theo vai trò" className="-mb-px flex gap-5 overflow-x-auto">
            {tabs.map((t) => {
              const active = role === t.key;
              const Icon = t.key === "LOCKED" ? Lock : t.key ? ROLE_STYLE[t.key].Icon : null;
              return (
                <button
                  key={t.label}
                  role="tab"
                  aria-selected={active}
                  onClick={() => pickRole(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 py-2.5 text-sm transition ${
                    active ? "border-primary font-medium text-primary-dark" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.key === "LOCKED" && Icon ? <Icon aria-hidden className="size-3.5" /> : null}
                  {t.label}
                  <span className="text-xs text-muted tabular-nums">{t.count}</span>
                </button>
              );
            })}
          </div>
          <p className="py-2.5 text-xs text-muted" aria-live="polite">
            {filtered.length === users.length ? `${users.length} tài khoản` : `${filtered.length} / ${users.length} tài khoản`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <UserRound aria-hidden className="size-6 text-muted/60" />
            <p className="text-sm text-muted">
              {query ? `Không có tài khoản nào khớp “${query}”.` : "Chưa có tài khoản nào trong nhóm này."}
            </p>
          </div>
        ) : (
          <div role="table" aria-label="Danh sách người dùng" className={`transition-opacity ${isStale ? "opacity-60" : ""}`}>
            <div role="row" className={`${GRID} hidden border-b border-line bg-canvas/60 px-4 py-2 text-xs font-medium text-muted lg:grid`}>
              <span role="columnheader">Người dùng</span>
              <span role="columnheader">Liên hệ</span>
              <span role="columnheader">Vai trò</span>
              <span role="columnheader">Tham gia</span>
              <span role="columnheader" className="text-right">
                Thao tác
              </span>
            </div>
            <div className="divide-y divide-line [&>*:last-child]:rounded-b-xl">
              {visible.map((u) => (
                <UserItem key={u.id} user={u} isSelf={u.id === currentAdminId} />
              ))}
            </div>
          </div>
        )}

        {filtered.length > visible.length ? (
          <div className="border-t border-line p-4 text-center">
            <button
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="rounded-lg border border-primary px-6 py-2 text-sm font-medium text-primary hover:bg-primary-light"
            >
              Xem thêm ({filtered.length - visible.length} tài khoản)
            </button>
          </div>
        ) : null}
      </section>
    </Content>
  );
}

// Cột của bảng (màn hình rộng): người dùng · liên hệ · vai trò · ngày tham gia · thao tác.
const GRID = "lg:grid lg:grid-cols-[minmax(220px,1.4fr)_minmax(220px,1.4fr)_190px_120px_72px] lg:items-center lg:gap-4";

function UserItem({ user: u, isSelf }: { user: UserRow; isSelf: boolean }) {
  const style = ROLE_STYLE[u.role];
  return (
    <div
      role="row"
      className={`${GRID} flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-sm transition hover:bg-canvas/60 ${u.locked_at ? "text-muted" : ""}`}
    >
      <div role="cell" className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
        <Avatar name={u.name} size="sm" />
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">{u.name}</div>
          <div className="font-mono text-xs text-muted">{u.code}</div>
        </div>
      </div>

      <div role="cell" className="min-w-0 basis-full space-y-0.5 text-sm lg:basis-auto">
        <div className="truncate text-ink">{u.email}</div>
        <div className="text-xs text-muted">{u.phone ?? "—"}</div>
      </div>

      <div role="cell" className="flex flex-wrap items-center gap-1.5">
        <Badge className={style.badge} Icon={style.Icon}>
          {ROLE_LABEL[u.role]}
        </Badge>
        {u.locked_at ? (
          <span title={u.locked_reason ?? undefined}>
            <Badge className="bg-danger-light text-danger" Icon={Lock}>
              Đã khoá
            </Badge>
          </span>
        ) : null}
      </div>

      <div role="cell" className="text-muted tabular-nums">
        {formatDate(u.created_at)}
      </div>

      <div role="cell" className="ml-auto lg:ml-0 lg:flex lg:justify-end">
        <UserActions user={u} isSelf={isSelf} />
      </div>
    </div>
  );
}
