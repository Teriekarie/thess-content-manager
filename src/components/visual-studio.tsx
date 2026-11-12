"use client";

import { useEffect, useRef, useState } from "react";
import { btnSecondary, field, label } from "@/components/ui";
import { fitText, type Measure } from "@/lib/content/wrap";

/** Graphics are drawn by the app itself on a canvas. No AI or outside image service is used. */

const W = 1080;
const H = 1350;
const PAD = 96;

const THEMES = {
  plum: { name: "Plum", bg: "#2a1438", text: "#ffffff", soft: "#d9cbe6", accent: "#f5b83d", onAccent: "#2a1438" },
  light: { name: "Light", bg: "#faf7fb", text: "#23122e", soft: "#62566b", accent: "#6d28d9", onAccent: "#ffffff" },
  violet: { name: "Violet", bg: "#6d28d9", text: "#ffffff", soft: "#e6d9fb", accent: "#f5b83d", onAccent: "#2a1438" },
} as const;
type ThemeKey = keyof typeof THEMES;

export type Slide = {
  kind: "quote" | "cover" | "content" | "closing";
  headline: string;
  body?: string;
  counter?: string;
};

function fontFamilies() {
  const root = getComputedStyle(document.documentElement);
  return {
    display: root.getPropertyValue("--font-space-grotesk").trim() || "system-ui, sans-serif",
    body: root.getPropertyValue("--font-inter").trim() || "system-ui, sans-serif",
  };
}

function drawSlide(canvas: HTMLCanvasElement, slide: Slide, themeKey: ThemeKey, footer: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const theme = THEMES[themeKey];
  const fonts = fontFamilies();
  const measureWith =
    (weight: number, family: string): Measure =>
    (text, size) => {
      ctx.font = `${weight} ${size}px ${family}`;
      return ctx.measureText(text).width;
    };

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";

  // Top row: a small mark on the left, the slide counter on the right.
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.roundRect(PAD, PAD, 72, 72, 18);
  ctx.fill();
  ctx.fillStyle = theme.onAccent;
  ctx.font = `700 44px ${fonts.display}`;
  ctx.textAlign = "center";
  ctx.fillText("T", PAD + 36, PAD + 14);
  ctx.textAlign = "left";
  if (slide.counter) {
    ctx.fillStyle = theme.soft;
    ctx.font = `600 30px ${fonts.body}`;
    ctx.textAlign = "right";
    ctx.fillText(slide.counter, W - PAD, PAD + 20);
    ctx.textAlign = "left";
  }

  const top = PAD + 150;
  const bottom = H - PAD - 90;
  const width = W - PAD * 2;
  let y = top;

  if (slide.kind === "quote") {
    ctx.fillStyle = theme.accent;
    ctx.font = `700 200px ${fonts.display}`;
    ctx.fillText("“", PAD - 8, y - 30);
    y += 150;
  } else {
    ctx.fillStyle = theme.accent;
    ctx.fillRect(PAD, y, 96, 10);
    y += 54;
  }

  const hasBody = Boolean(slide.body?.trim());
  const headlineBox = { width, height: (bottom - y) * (hasBody ? 0.42 : 1) };
  const headline = fitText(
    slide.headline,
    headlineBox,
    { max: slide.kind === "content" ? 76 : 96, min: 40, lineHeight: 1.16 },
    measureWith(700, fonts.display),
  );
  ctx.fillStyle = theme.text;
  ctx.font = `700 ${headline.fontSize}px ${fonts.display}`;
  for (const line of headline.lines) {
    ctx.fillText(line, PAD, y);
    y += headline.fontSize * 1.16;
  }

  if (hasBody) {
    y += 36;
    const body = fitText(
      slide.body as string,
      { width, height: bottom - y },
      { max: 44, min: 28, lineHeight: 1.42 },
      measureWith(400, fonts.body),
    );
    ctx.fillStyle = theme.soft;
    ctx.font = `400 ${body.fontSize}px ${fonts.body}`;
    for (const line of body.lines) {
      ctx.fillText(line, PAD, y);
      y += body.fontSize * 1.42;
    }
  }

  // Footer
  ctx.fillStyle = theme.soft;
  ctx.fillRect(PAD, H - PAD - 56, width, 2);
  ctx.font = `600 30px ${fonts.body}`;
  ctx.fillText(footer.slice(0, 60), PAD, H - PAD - 34);
}

function SlideCanvas({ slide, theme, footer, fileName }: {
  slide: Slide; theme: ThemeKey; footer: string; fileName: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (!cancelled && ref.current) drawSlide(ref.current, slide, theme, footer);
    };
    draw();
    // Draw again once the web fonts have loaded, so the picture uses the right typeface.
    document.fonts?.ready.then(draw);
    return () => {
      cancelled = true;
    };
  }, [slide, theme, footer]);

  function download() {
    ref.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <figure className="flex flex-col gap-2">
      <canvas ref={ref} width={W} height={H} role="img" aria-label={slide.headline}
        className="w-full rounded-xl border border-line" />
      <button type="button" onClick={download} data-download className={`${btnSecondary} !min-h-10 text-sm`}>
        Download PNG
      </button>
    </figure>
  );
}

function ThemePicker({ value, onChange }: { value: ThemeKey; onChange: (t: ThemeKey) => void }) {
  return (
    <div role="group" aria-label="Colour style" className="flex flex-wrap gap-2">
      {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 font-semibold ${
            value === key ? "border-2 border-accent" : "border-line-strong"
          }`}>
          <span aria-hidden="true" className="h-4 w-4 rounded-full border border-line-strong"
            style={{ background: THEMES[key].bg }} />
          {THEMES[key].name}
        </button>
      ))}
    </div>
  );
}

const slug = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "post";

/** One designed card from a short line of text. Editing the text redraws it. */
export function GraphicStudio({ initialText, footer, title }: {
  initialText: string; footer: string; title: string;
}) {
  const [text, setText] = useState(initialText);
  const [theme, setTheme] = useState<ThemeKey>("plum");
  const [quote, setQuote] = useState(true);

  return (
    <div className="flex flex-wrap gap-5 border-t border-line pt-4">
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-text" className={label}>Text on the graphic</label>
          <textarea id="card-text" rows={4} value={text} onChange={(e) => setText(e.target.value)}
            maxLength={220} className={field} />
          <p className="text-[13px] text-muted">Short lines work best. The size adjusts so it always fits.</p>
        </div>
        <ThemePicker value={theme} onChange={setTheme} />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={quote} onChange={(e) => setQuote(e.target.checked)}
            className="h-[18px] w-[18px]" />
          Show the quote mark
        </label>
      </div>
      <div className="w-full max-w-[280px]">
        <SlideCanvas slide={{ kind: quote ? "quote" : "cover", headline: text || " " }} theme={theme}
          footer={footer} fileName={`${slug(title)}.png`} />
      </div>
    </div>
  );
}

/** The slides of a carousel, drawn from the saved slide text. */
export function CarouselStudio({ slides, footer, title }: {
  slides: Slide[]; footer: string; title: string;
}) {
  const [theme, setTheme] = useState<ThemeKey>("plum");
  const grid = useRef<HTMLDivElement>(null);

  function downloadAll() {
    const buttons = grid.current?.querySelectorAll<HTMLButtonElement>("button[data-download]") ?? [];
    buttons.forEach((button, i) => setTimeout(() => button.click(), i * 350));
  }

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ThemePicker value={theme} onChange={setTheme} />
        <button type="button" onClick={downloadAll} className={btnSecondary}>Download all slides</button>
      </div>
      <div ref={grid} className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {slides.map((slide, i) => (
          <SlideCanvas key={`${i}-${slide.headline}`} slide={slide} theme={theme} footer={footer}
            fileName={`${slug(title)}-${String(i + 1).padStart(2, "0")}.png`} />
        ))}
      </div>
      <p className="text-[13px] text-muted">
        Slides are 1080 by 1350 pixels. Upload them in order to Instagram, or to LinkedIn as images.
      </p>
    </div>
  );
}
