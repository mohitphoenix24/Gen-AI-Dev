let counter = 0;

/** A unique-enough id for a chat message, so React (and our own update logic) can key on it. */
export function nextId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  counter += 1;
  return `id-${counter}`;
}
