import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const SESSION_COOKIE = "rankmint_sid";

export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? "anonymous";
}

export function newSessionId(): string {
  return randomUUID();
}
