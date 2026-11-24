export const staticBase = process.env.NEXT_PUBLIC_IISPC_STATIC_BASE || "";

export function withStaticBase(path: string) {
  return staticBase + path;
}
