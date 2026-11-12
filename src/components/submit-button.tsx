"use client";

import { useFormStatus } from "react-dom";

/** A form button that shows a waiting message while its action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} name={name} value={value}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
