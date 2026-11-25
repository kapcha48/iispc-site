export function visualField(path: string | undefined, field: string, value: string | null, label: string) {
  return process.env.IISPC_PREVIEW === "1" && path ? {
    "data-edit-path": path,
    "data-edit-field": field,
    "data-edit-value": value ?? "",
    "data-edit-label": label,
  } : {};
}
