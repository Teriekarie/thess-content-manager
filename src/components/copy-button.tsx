"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: fall back to a hidden text box, which keeps line breaks.
      const box = document.createElement("textarea");
      box.value = text;
      box.style.position = "fixed";
      box.style.opacity = "0";
      document.body.appendChild(box);
      box.select();
      document.execCommand("copy");
      box.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
