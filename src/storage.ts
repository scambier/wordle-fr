export function setItem(k: string, v: string): void {
  return localStorage.setItem(k, v)
}
export function getItem(k: string): string | null
export function getItem(k: string, defaultValue: string): string
export function getItem(k: string, defaultValue?: string): string | null {
  try {
    return localStorage.getItem(k) ?? defaultValue ?? null
  }
  catch (e) {
    return defaultValue ?? null
  }
}
