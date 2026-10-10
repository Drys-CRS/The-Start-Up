import fs from "node:fs";
import path from "node:path";

// Screenshot frame for the case study. The images land in /public/case-study as
// they get captured, so a missing one has to degrade into something readable.
//
// This checks the file on the server rather than using an onError handler on
// the img: the error event fires while the HTML is still loading, before React
// hydrates, so the handler never runs and the visitor gets the browser's broken
// image icon. The page is statically generated, so this check happens at build
// time and costs nothing at runtime. Adding a file means redeploying, which is
// what happens anyway.
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
  const exists = fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
  const file = src.replace(/^\/case-study\//, "");

  return (
    <figure className={wide ? "my-7" : "my-7 sm:max-w-xl"}>
      {exists ? (
        <img
          src={src}
          alt={alt}
          className="w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        />
      ) : (
        <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Screenshot to come</p>
          <p className="mt-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">public/case-study/{file}</p>
        </div>
      )}
      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{caption}</figcaption>
    </figure>
  );
}
