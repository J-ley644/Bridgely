import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getConversations } from "../services/api";
import socket from "../services/socket";

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(
    new Set()
  );
  const [loadingConversations, setLoadingConversations] =
    useState(true);
  const [conversationError, setConversationError] =
    useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("bridgelyToken");
    const storedUser = sessionStorage.getItem("bridgelyUser");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      sessionStorage.removeItem("bridgelyToken");
      sessionStorage.removeItem("bridgelyUser");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    function handleOnlineUsers(data) {
      console.log(
        "🟢 Initial online users received:",
        data
      );

      setOnlineUserIds(
        new Set(data?.userIds || [])
      );
    }

    function handlePresenceUpdate(presence) {
      console.log(
        "🟢 Home presence update:",
        presence
      );

      setOnlineUserIds((current) => {
        const next = new Set(current);

        if (presence.status === "online") {
          next.add(presence.userId);
        } else if (
          presence.status === "offline"
        ) {
          next.delete(presence.userId);
        }

        return next;
      });
    }

    socket.on(
      "presence:online-users",
      handleOnlineUsers
    );

    socket.on(
      "presence:update",
      handlePresenceUpdate
    );

    return () => {
      socket.off(
        "presence:online-users",
        handleOnlineUsers
      );

      socket.off(
        "presence:update",
        handlePresenceUpdate
      );
    };
  }, [user]);

  async function loadConversations() {
    setLoadingConversations(true);
    setConversationError("");

    try {
      const result = await getConversations();

      setConversations(result.conversations || []);
    } catch (error) {
      console.error(
        "Load conversations error:",
        error
      );

      setConversationError(
        error.message ||
          "Unable to load your conversations."
      );
    } finally {
      setLoadingConversations(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("bridgelyToken");
    sessionStorage.removeItem("bridgelyUser");

    navigate("/login");
  }

  function getOtherMember(conversation) {
    const members = conversation.members || [];

    return (
      members.find(
        (member) => member.userId !== user?.id
      )?.user || null
    );
  }

  function getConversationPreview(conversation) {
    const lastMessage = conversation.messages?.[0];

    if (!lastMessage) {
      return "Start a conversation";
    }

    if (lastMessage.senderId === user?.id) {
      return `You: ${lastMessage.content}`;
    }

    return lastMessage.content;
  }

  function formatConversationTime(conversation) {
    const lastMessage = conversation.messages?.[0];

    if (!lastMessage?.createdAt) {
      return "";
    }

    const date = new Date(lastMessage.createdAt);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isUserOnline(userId) {
    return onlineUserIds.has(userId);
  }

  if (!user) {
    return null;
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-logo">
          <span className="brand-mark">B</span>
          <span>Bridgely</span>
        </div>

        <div className="home-profile">
          <div className="home-avatar">
            {user.displayName
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div className="home-user-info">
            <strong>{user.displayName}</strong>
            <span>@{user.username}</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="welcome-section">
          <span className="section-label">
            YOUR SPACE
          </span>

          <h1>
            Welcome back,{" "}
            <span>{user.displayName}</span>.
          </h1>

          <p>
            Find people, start conversations, and
            connect without sharing your phone number.
          </p>
        </section>

        <section className="home-grid">
          <div className="home-panel search-panel">
            <div className="panel-icon">⌕</div>

            <div>
              <span className="panel-label">
                DISCOVER
              </span>

              <h2>Find someone</h2>

              <p>
                Search for people using their unique
                Bridgely username.
              </p>
            </div>

            <button
              className="panel-action"
              onClick={() => navigate("/search")}
            >
              Search users
              <span>→</span>
            </button>
          </div>

          <div className="home-panel conversations-panel">
            <div className="panel-icon">◌</div>

            <div>
              <span className="panel-label">
                MESSAGES
              </span>

              <h2>Your conversations</h2>

              <p>
                Your private conversations will appear
                here.
              </p>
            </div>

            {loadingConversations ? (
              <div className="empty-conversations">
                <div className="empty-circle">◌</div>

                <span>
                  Loading conversations...
                </span>
              </div>
            ) : conversationError ? (
              <div className="empty-conversations">
                <div className="empty-circle">!</div>

                <span>{conversationError}</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-conversations">
                <div className="empty-circle">+</div>

                <span>
                  No conversations yet
                </span>
              </div>
            ) : (
              <div className="conversation-list">
                {conversations.map((conversation) => {
                  const otherUser =
                    getOtherMember(conversation);

                  const otherUserIsOnline =
                    otherUser
                      ? isUserOnline(otherUser.id)
                      : false;

                  return (
                    <button
                      key={conversation.id}
                      className="conversation-item"
                      onClick={() =>
                        navigate(
                          `/conversation/${conversation.id}`
                        )
                      }
                    >
                      <div className="conversation-item-avatar">
                        {otherUser?.displayName
                          ?.charAt(0)
                          .toUpperCase() || "B"}
                      </div>

                      <div className="conversation-item-content">
                        <div className="conversation-item-top">
                          <strong>
                            {otherUser?.displayName ||
                              "Bridgely user"}
                          </strong>

                          <span>
                            {formatConversationTime(
                              conversation
                            )}
                          </span>
                        </div>

                        <div className="conversation-item-bottom">
                          <span>
                            {otherUser?.username
                              ? `@${otherUser.username}`
                              : ""}
                          </span>

                          <p>
                            {getConversationPreview(
                              conversation
                            )}
                          </p>
                        </div>

                        {otherUser && (
                          <div className="conversation-item-presence">
                            <span
                              className={`presence-dot ${
                                otherUserIsOnline
                                  ? "presence-online"
                                  : "presence-offline"
                              }`}
                            />

                            <span>
                              {otherUserIsOnline
                                ? "Online"
                                : "Offline"}
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="conversation-arrow">
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="privacy-banner">
          <div className="privacy-mark">✓</div>

          <div>
            <strong>
              Your number stays private.
            </strong>

            <p>
              People connect with you through your
              Bridgely username, not your phone number.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;