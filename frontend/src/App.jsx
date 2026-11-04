
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";

import { getSession } from "./services/session";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Conversation from "./pages/Conversation";
import Rooms from "./pages/Rooms";
import Room from "./pages/Room";

import { ThemeProvider } from "./context/ThemeContext";

import {
  connectSocket,
  disconnectSocket,
} from "./services/socket";

function GlobalSocket() {
  const location = useLocation();

  useEffect(() => {
    const token = sessionStorage.getItem("bridgelyToken");

    if (!token) {
      disconnectSocket();
      return;
    }

    console.log(
      "🌐 Starting global Bridgely real-time connection..."
    );

    const socket = connectSocket(token);

    function handleConnect() {
      console.log(
        "⚡ Global Bridgely real-time connection established:",
        socket.id
      );
    }

    function handleDisconnect() {
      console.log(
        "⚡ Global Bridgely real-time connection closed"
      );
    }

    function handleConnectError(error) {
      console.error(
        "❌ Global Socket.IO connection error:",
        error.message
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [location.pathname]);

  return null;
}

function AndroidBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const listener = CapacitorApp.addListener("backButton", () => {
      if (location.pathname.startsWith("/conversation/")) {
        navigate("/home");
        return;
      }

      if (location.pathname.startsWith("/rooms/")) {
        navigate("/rooms");
        return;
      }

      if (location.pathname === "/search") {
        navigate("/home");
        return;
      }

      if (location.pathname !== "/home") {
        navigate(-1);
        return;
      }

      CapacitorApp.exitApp();
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, [location.pathname, navigate]);

  return null;
}

function SessionRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = sessionStorage.getItem("bridgelyToken");

    if (!token) {
      return;
    }

    if (
      location.pathname === "/" ||
      location.pathname === "/login" ||
      location.pathname === "/register" ||
      location.pathname === "/verify"
    ) {
      navigate("/home", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionDiagnostics, setSessionDiagnostics] = useState(null);

  useEffect(() => {
    async function restoreSession() {
  let nativeToken = false;
  let nativeUser = false;

  try {
    const token = await Preferences.get({
      key: "bridgelyToken",
    });

    const user = await Preferences.get({
      key: "bridgelyUser",
    });

    nativeToken = !!token.value;
    nativeUser = !!user.value;
  } catch (error) {
    console.error("Native diagnostic failed:", error);
  }

  const localToken = !!localStorage.getItem("bridgelyToken");
  const localUser = !!localStorage.getItem("bridgelyUser");

  setSessionDiagnostics({
    nativeToken,
    nativeUser,
    localToken,
    localUser,
  });

  try {
    const session = await getSession();

    if (session?.token) {
      sessionStorage.setItem("bridgelyToken", session.token);

      if (session.user) {
        sessionStorage.setItem(
          "bridgelyUser",
          JSON.stringify(session.user)
        );
      }
    } else {
      sessionStorage.removeItem("bridgelyToken");
      sessionStorage.removeItem("bridgelyUser");
    }
  } catch (error) {
    console.error("Failed to restore Bridgely session:", error);
  } finally {
    setSessionReady(true);
  }
}

    restoreSession();
  }, []);

  if (!sessionReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
      {sessionDiagnostics && (
  <div
    style={{
      position: "fixed",
      top: 10,
      left: 10,
      right: 10,
      zIndex: 99999,
      background: "#111827",
      color: "white",
      padding: 14,
      borderRadius: 10,
      fontSize: 13,
    }}
  >
    <strong>Bridgely Session Diagnostics</strong>

    <div>Native token: {sessionDiagnostics.nativeToken ? "YES" : "NO"}</div>
    <div>Native user: {sessionDiagnostics.nativeUser ? "YES" : "NO"}</div>
    <div>Local token: {sessionDiagnostics.localToken ? "YES" : "NO"}</div>
    <div>Local user: {sessionDiagnostics.localUser ? "YES" : "NO"}</div>
  </div>
)}
        <GlobalSocket />
        <AndroidBackHandler />
        <SessionRedirect />

        <Routes>
          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/verify"
            element={<Verify />}
          />

          <Route
            path="/home"
            element={<Home />}
          />

          <Route
            path="/search"
            element={<Search />}
          />

          <Route
            path="/rooms"
            element={<Rooms />}
          />

          <Route
            path="/rooms/:roomId"
            element={<Room />}
          />

          <Route
            path="/conversation/:conversationId"
            element={<Conversation />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

