import { publicEnv } from "@/lib/config/public-env";

export function getPerpsPairFactoryAddress(): `0x${string}` | undefined {
  const raw = publicEnv.perpsPairFactoryAddress?.trim();
  if (!raw || !raw.startsWith("0x") || raw.length < 42) return undefined;
  return raw as `0x${string}`;
}

export function isPerpsPairFactoryConfigured(): boolean {
  return getPerpsPairFactoryAddress() != null;
}
