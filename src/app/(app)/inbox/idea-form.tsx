"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { btnDark, btnPrimary, btnSecondary, field, label } from "@/components/ui";
import { LEARNING_NOTE_FIELDS, TONES } from "@/lib/content/defaults";
import { addIdea } from "./actions";

export function IdeaForm() {
  const [type, setType] = useState<"thought" | "learning_note">("thought");

  return (
    <form action={addIdea} className="flex flex-col gap-4">
      <input type="hidden" name="input_type" value={type} />
      <div role="group" aria-label="Type of idea" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={type === "thought"} onClick={() => setType("thought")}
          className={type === "thought" ? btnDark : btnSecondary}>
          Quick thought
        </button>
        <button type="button" aria-pressed={type === "learning_note"} onClick={() => setType("learning_note")}
          className={type === "learning_note" ? btnDark : btnSecondary}>
          Learning note
        </button>
      </div>

      {type === "thought" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="thought" className={label}>What is on your mind?</label>
          <textarea id="thought" name="thought" rows={5} className={field}
            placeholder="Type or paste a rough thought, an opinion, something that made you laugh at work. It does not need to be tidy." />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-ground px-4 py-3 text-sm text-muted">
            A learning note is for something you worked through with an AI tool or on a project: what
            you tried, what blocked you and how you fixed it. These make strong posts. The quickest way
            is to copy the prompt further down this page into your AI chat, then paste its answer here.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pasted" className={label}>Paste a whole learning note</label>
            <textarea id="pasted" name="pasted" rows={5} className={field}
              placeholder="Paste the answer your AI chat gave you from the prompt below. Or fill in the boxes underneath instead." />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {LEARNING_NOTE_FIELDS.map((f) => (
              <div key={f.name} className="flex flex-col gap-1.5">
                <label htmlFor={f.name} className={label}>{f.label}</label>
                <textarea id={f.name} name={f.name} rows={2} className={field} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-[1_1_240px] flex-col gap-1.5 md:max-w-[320px]">
          <label htmlFor="tone" className={label}>Tone</label>
          <select id="tone" name="tone" className={`${field} min-h-11`}>
            {Object.entries(TONES).map(([value, name]) => (
              <option key={value} value={value}>{name}</option>
            ))}
          </select>
        </div>
        <SubmitButton className={btnPrimary} pendingLabel="Saving…">Save idea</SubmitButton>
      </div>
    </form>
  );
}
