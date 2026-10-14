export function PreviewBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div
      role="note"
      style={{
        background: "var(--st-progress)",
        color: "var(--st-progress-ink)",
        padding: "var(--space-4) var(--margin)",
        fontWeight: 500,
      }}
    >
      {children ?? "Interface preview with example data. No eligibility check or transaction took place."}
    </div>
  );
}
