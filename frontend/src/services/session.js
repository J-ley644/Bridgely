import { Preferences } from "@capacitor/preferences";

const TOKEN_KEY = "bridgelyToken";
const USER_KEY = "bridgelyUser";

export async function saveSession(token, user) {
  await Preferences.set({
    key: TOKEN_KEY,
    value: token,
  });

  await Preferences.set({
    key: USER_KEY,
    value: JSON.stringify(user),
  });
}

export async function getSession() {
  const tokenResult = await Preferences.get({
    key: TOKEN_KEY,
  });

  const userResult = await Preferences.get({
    key: USER_KEY,
  });

  if (!tokenResult.value) {
    return null;
  }

  let user = null;

  if (userResult.value) {
    try {
      user = JSON.parse(userResult.value);
    } catch {
      user = null;
    }
  }

  return {
    token: tokenResult.value,
    user,
  };
}

export async function clearSession() {
  await Preferences.remove({
    key: TOKEN_KEY,
  });

  await Preferences.remove({
    key: USER_KEY,
  });
}