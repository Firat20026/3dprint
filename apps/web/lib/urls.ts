/**
 * Pure URL helpers — client + server safe (no node: imports).
 */
export function publicUrlFor(key: string | null | undefined): string | null {
  if (!key) return null;
  return `/api/files/${key}`;
}
