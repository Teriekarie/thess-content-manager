export function Notice({ kind, children }: { kind: "warn" | "ok"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "warn" ? "alert" : "status"}
      className={`rounded-lg px-4 py-3 text-sm ${
        kind === "warn" ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"
      }`}
    >
      {children}
    </p>
  );
}
