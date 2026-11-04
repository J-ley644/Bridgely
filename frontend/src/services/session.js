
import { Preferences } from "@capacitor/preferences";

const TOKEN_KEY = "bridgelyToken";
const USER_KEY = "bridgelyUser";

export async function saveSession(token, user) {
  const userValue = JSON.stringify(user);

  // Primary persistent native storage
  await Preferences.set({
    key: TOKEN_KEY,
    value: token,
  });

  await Preferences.set({
    key: USER_KEY,
    value: userValue,
  });

  // Backup persistent WebView storage
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, userValue);
}

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

  // Recover missing values from persistent backup
  if (!token) {
    token = localStorage.getItem(TOKEN_KEY);
  }

  if (!userValue) {
    userValue = localStorage.getItem(USER_KEY);
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

export async function clearSession() {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: USER_KEY });

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
