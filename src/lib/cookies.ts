// Small cookie helpers shared by any hook that needs to read/write a
// browser cookie (role-view overrides, dev-user overrides, etc). Keeping
// this in one place avoids the get/set/clear logic drifting between hooks
// that touch related cookies (e.g. dev-user-override clears active-role-view).

export function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function setCookie(name: string, value: string, maxAgeSeconds = 31536000): void {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
}