import { btnDanger, btnDark, btnOk, btnSecondary, field } from "@/components/ui";
import { setOutcome } from "@/app/(app)/posts/actions";
import { formatDate, formatDay } from "@/lib/dates";

type Props = {
  postId: string;
  status: string;
  scheduledFor: string | null;
  back: string;
  today: string;
};

function Outcome({ postId, back, outcome, className, children }: {
  postId: string; back: string; outcome: string; className: string; children: React.ReactNode;
}) {
  return (
    <form action={setOutcome}>
      <input type="hidden" name="id" value={postId} />
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="outcome" value={outcome} />
      <button type="submit" className={className}>{children}</button>
    </form>
  );
}

/** Posted, Next week, Schedule for a date and Discard, with Undo once chosen. */
export function OutcomeButtons({ postId, status, scheduledFor, back, today }: Props) {
  if (status !== "planned") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
          status === "posted" ? "bg-ok-soft text-ok" : "bg-[#f6e3e0] text-[#8a2b1d]"
        }`}>
          {status === "posted" ? "Posted" : "Discarded"}
        </span>
        <Outcome postId={postId} back={back} outcome="undo" className="min-h-11 px-2 text-muted underline">
          Undo
        </Outcome>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Outcome postId={postId} back={back} outcome="posted" className={btnOk}>Posted</Outcome>
      <Outcome postId={postId} back={back} outcome="next_week" className={btnSecondary}>Next week</Outcome>
      <form action={setOutcome} className="flex items-end gap-2">
        <input type="hidden" name="id" value={postId} />
        <input type="hidden" name="back" value={back} />
        <input type="hidden" name="outcome" value="schedule" />
        <label className="flex flex-col gap-1 text-[13px] font-semibold">
          Move to a date
          <input type="date" name="date" required min={today} defaultValue={scheduledFor ?? today}
            className={`${field} min-h-11 py-0`} />
        </label>
        <button type="submit" className={btnDark}>Schedule</button>
      </form>
      <Outcome postId={postId} back={back} outcome="discard" className={btnDanger}>Discard</Outcome>
    </div>
  );
}

export function ScheduledLabel({ date }: { date: string | null }) {
  return <>{date ? `${formatDay(date)} ${formatDate(date)}` : "No date yet"}</>;
}
