export function PasswordToggle({
  visible,
  onToggle,
  className = "right-2 size-10",
}: {
  visible: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      className={`absolute top-1/2 ${className} inline-flex -translate-y-1/2 items-center justify-center rounded-control border-0 bg-transparent text-(--text-secondary) hover:bg-[rgb(153_191_240/12%)] hover:text-(--text-primary)`}
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      onClick={onToggle}
    >
      <svg
        className="size-5"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {!visible ? (
          <>
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8a12.8 12.8 0 0 1-3.1 5.1" />
            <path d="M6.6 6.6C4.3 8.1 2.8 10.4 2 12c1.3 4 5 8 10 8a10.8 10.8 0 0 0 2.1-.2" />
          </>
        ) : (
          <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}
