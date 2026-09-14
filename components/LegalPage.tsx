import Link from "next/link";
import WordMark from "@/components/WordMark";

// Shared shell for the Privacy, Terms, and Refund pages.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 px-5 py-10 font-sans text-slate-900 dark:text-slate-100">
      <article className="mx-auto max-w-3xl">
        <Link href="/" aria-label="The Start Up home" className="inline-block">
          <WordMark className="scale-75 origin-left" />
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated {updated}</p>
        <div className="mt-10 space-y-9">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 [&_a]:font-medium [&_a]:text-teal-600 dark:[&_a]:text-teal-400 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
