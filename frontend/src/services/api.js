
const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
}

export async function registerUser(userData) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function verifyAccount(
  username,
  code
) {
  return apiRequest("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({
      username,
      code,
    }),
  });
}

export async function resendVerification(
  username
) {
  return apiRequest(
    "/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({
        username,
      }),
    }
  );
}

export async function loginUser(
  username,
  password
) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function loginFirebaseUser(
  idToken
) {
  return apiRequest(
    "/auth/firebase/login",
    {
      method: "POST",
      body: JSON.stringify({
        idToken,
      }),
    }
  );
}

export async function linkFirebaseAccount(
  idToken
) {
  return apiRequest(
    "/auth/firebase/link",
    {
      method: "POST",
      body: JSON.stringify({
        idToken,
      }),
    }
  );
}

export async function registerFirebaseUser({
  idToken,
  username,
  displayName,
  phoneNumber,
}) {
  return apiRequest(
    "/auth/firebase/register",
    {
      method: "POST",
      body: JSON.stringify({
        idToken,
        username,
        displayName,
        phoneNumber,
      }),
    }
  );
}

export async function searchUser(
  username
) {
  const token =
    sessionStorage.getItem(
      "bridgelyToken"
    );

  return apiRequest(
    `/users/search?username=${encodeURIComponent(
      username
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

