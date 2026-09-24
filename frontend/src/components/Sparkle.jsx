/** The brand mark - a four-point sparkle. Reused in the header, empty state, and message meta rows. */
export default function Sparkle(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.5c.6 4.2 1.4 7 3 8.6 1.6 1.6 4.4 2.4 8.6 3-4.2.6-7 1.4-8.6 3-1.6 1.6-2.4 4.4-3 8.6-.6-4.2-1.4-7-3-8.6-1.6-1.6-4.4-2.4-8.6-3 4.2-.6 7-1.4 8.6-3 1.6-1.6 2.4-4.4 3-8.6Z"
      />
    </svg>
  );
}
