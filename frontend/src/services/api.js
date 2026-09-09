
const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
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

function getAuthHeaders() {
  const token =
    sessionStorage.getItem("bridgelyToken");

  return {
    Authorization: `Bearer ${token}`,
  };
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
  return apiRequest(
    `/users/search?username=${encodeURIComponent(
      username
    )}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
}

export async function createDirectConversation(
  username
) {
  return apiRequest(
    "/conversations/direct",
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        username,
      }),
    }
  );
}

export async function getConversations() {
  return apiRequest(
    "/conversations",
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
}

export async function getConversation(
  conversationId
) {
  return apiRequest(
    `/conversations/${conversationId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
}

export async function getConversationMessages(
  conversationId
) {
  return apiRequest(
    `/conversations/${conversationId}/messages`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );
}

export async function sendConversationMessage(
  conversationId,
  content
) {
  return apiRequest(
    `/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content,
      }),
    }
  );
}

