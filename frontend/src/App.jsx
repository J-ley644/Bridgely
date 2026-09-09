import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Conversation from "./pages/Conversation";
import Rooms from "./pages/Rooms";

import {
  connectSocket,
  disconnectSocket,
} from "./services/socket";

function GlobalSocket() {
  const location = useLocation();

  useEffect(() => {
    const token =
      sessionStorage.getItem("bridgelyToken");

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
    socket.on(
      "connect_error",
      handleConnectError
    );

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off(
        "disconnect",
        handleDisconnect
      );
      socket.off(
        "connect_error",
        handleConnectError
      );
    };
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <GlobalSocket />

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

        <Route path="/rooms" element={<Rooms />} />

        <Route
          path="/conversation/:conversationId"
          element={<Conversation />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;