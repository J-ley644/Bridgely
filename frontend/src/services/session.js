import { Preferences } from "@capacitor/preferences";

const TOKEN_KEY = "bridgelyToken";
const USER_KEY = "bridgelyUser";

// Save session persistently
export async function saveSession(token, user) {
  const userValue = JSON.stringify(user);

  // Always save the WebView backup
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userValue);
  } catch (error) {
    console.error("Local session backup failed:", error);
  }

  // Save to native persistent storage
  try {
    await Preferences.set({
      key: TOKEN_KEY,
      value: token,
    });

    await Preferences.set({
      key: USER_KEY,
      value: userValue,
    });
  } catch (error) {
    console.error("Native session storage failed:", error);
  }
}

// Recover session when the app opens
export async function getSession() {
  let token = null;
  let userValue = null;

  // Try native storage first
  try {
    const tokenResult = await Preferences.get({
      key: TOKEN_KEY,
    });

    const userResult = await Preferences.get({
      key: USER_KEY,
    });

    token = tokenResult.value;
    userValue = userResult.value;
  } catch (error) {
    console.error("Native session recovery failed:", error);
  }

  // Recover missing values from local backup
  try {
    if (!token) {
      token = localStorage.getItem(TOKEN_KEY);
    }

    if (!userValue) {
      userValue = localStorage.getItem(USER_KEY);
    }
  } catch (error) {
    console.error("Local session recovery failed:", error);
  }

  if (!token) {
    return null;
  }

  let user = null;

  if (userValue) {
    try {
      user = JSON.parse(userValue);
    } catch {
      user = null;
    }
  }

  return { token, user };
}

// Clear session safely during logout
export async function clearSession() {
  try {
    await Preferences.remove({ key: TOKEN_KEY });
  } catch (error) {
    console.error("Could not remove native token:", error);
  }

  try {
    await Preferences.remove({ key: USER_KEY });
  } catch (error) {
    console.error("Could not remove native user:", error);
  }

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Could not clear local session:", error);
  }
}