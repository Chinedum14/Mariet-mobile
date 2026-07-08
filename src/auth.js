// App login gate (same light gate as the desktop app). Client-side check.
export const APP_USERNAME = "Varol";
export const APP_PASSWORD = "ResearchAndPlay";

export function checkLogin(username, password) {
  return username === APP_USERNAME && password === APP_PASSWORD;
}
