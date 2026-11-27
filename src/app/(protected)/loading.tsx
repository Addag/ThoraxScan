import { Brand } from "@/components/brand";

// Shown while a Student, Professor or administrator page renders on the server.
// Each page draws its own AppShell, so this keeps the shell's frame and brand in place meanwhile.
export default function Loading() {
  return (
    <div className="grid min-h-svh grid-cols-[230px_minmax(0,1fr)] bg-(--app-background) text-foreground max-[850px]:block">
      <div className="sticky top-0 h-svh border-r border-r-(--border-shell) bg-(--glass-shell) px-3.5 pt-6 max-[850px]:relative max-[850px]:h-auto max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:border-b-(--border-shell) max-[850px]:px-[18px] max-[850px]:py-3.5">
        <Brand variant="sidebar" />
      </div>
      <main className="grid min-h-[60svh] place-items-center p-6">
        <p className="m-0 flex items-center gap-3 text-small font-semibold text-(--text-muted)" role="status">
          <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          Loading…
        </p>
      </main>
    </div>
  );
}
