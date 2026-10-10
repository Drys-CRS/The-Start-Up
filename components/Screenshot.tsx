"use client";

import { useState } from "react";

// Screenshot frame for the case study. The images live in /public/case-study and
// are added as they get captured, so a missing file has to degrade into
// something readable rather than a broken image icon. onError swaps in a frame
// that names the file we're waiting on.
export default function Screenshot({
  src,
  alt,
  caption,
  wide = false,
}: {
  src: string;
  alt: string;
  caption: string;
  wide?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const file = src.replace(/^\/case-study\//, "");

  return (
    <figure className={wide ? "my-7" : "my-7 sm:max-w-xl"}>
      {failed ? (
        <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Screenshot to come</p>
          <p className="mt-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">public/case-study/{file}</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        />
      )}
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{caption}</figcaption>
    </figure>
  );
}
