import type { Messages } from "./messages";

export function getMessage(messages: Messages, path: string): string {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object" || !(p in cur)) {
      return path;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}
