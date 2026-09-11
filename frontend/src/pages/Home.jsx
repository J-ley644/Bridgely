
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getConversations,
  getMyRooms,
} from "../services/api";

import socket from "../services/socket";
import ThemeToggle from "../components/ThemeToggle";

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(
    new Set()
  );

  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [loadingRooms, setLoadingRooms] =
    useState(true);

  const [conversationError, setConversationError] =
    useState("");

  const [roomError, setRoomError] =
    useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");

  useEffect(() => {
    const token =
      sessionStorage.getItem("bridgelyToken");

    const storedUser =
      sessionStorage.getItem("bridgelyUser");

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
    loadRooms();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    function handleOnlineUsers(data) {
      setOnlineUserIds(
        new Set(data?.userIds || [])
      );
    }

    function handlePresenceUpdate(presence) {
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

      setConversations(
        result.conversations || []
      );
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

  async function loadRooms() {
    setLoadingRooms(true);
    setRoomError("");

    try {
      const result = await getMyRooms();

      setRooms(result.rooms || []);
    } catch (error) {
      console.error(
        "Load rooms error:",
        error
      );

      setRoomError(
        error.message ||
          "Unable to load your rooms."
      );
    } finally {
      setLoadingRooms(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(
      "bridgelyToken"
    );

    sessionStorage.removeItem(
      "bridgelyUser"
    );

    navigate("/login");
  }

  function getOtherMember(conversation) {
    const members =
      conversation.members || [];

    return (
      members.find(
        (member) =>
          member.userId !== user?.id
      )?.user || null
    );
  }

  function getConversationPreview(
    conversation
  ) {
    const lastMessage =
      conversation.messages?.[0];

    if (!lastMessage) {
      return "Start a conversation";
    }

    if (
      lastMessage.senderId === user?.id
    ) {
      return `You: ${lastMessage.content}`;
    }

    return lastMessage.content;
  }

  function formatConversationTime(
    conversation
  ) {
    const lastMessage =
      conversation.messages?.[0];

    if (!lastMessage?.createdAt) {
      return "";
    }

    const date =
      new Date(lastMessage.createdAt);

    const now = new Date();

    const isToday =
      date.toDateString() ===
      now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }

    const yesterday =
      new Date(now);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      date.toDateString() ===
      yesterday.toDateString()
    ) {
      return "Yesterday";
    }

    return date.toLocaleDateString(
      [],
      {
        day: "2-digit",
        month: "short",
      }
    );
  }

  function formatRoomMembers(room) {
    const count =
      room._count?.members ||
      room.members?.length ||
      0;

    return `${count} ${
      count === 1
        ? "member"
        : "members"
    }`;
  }

  function isUserOnline(userId) {
    return onlineUserIds.has(userId);
  }

  const filteredConversations =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) => {
          const otherUser =
            getOtherMember(
              conversation
            );

          const name =
            otherUser?.displayName ||
            "";

          const username =
            otherUser?.username ||
            "";

          const preview =
            getConversationPreview(
              conversation
            );

          return (
            name
              .toLowerCase()
              .includes(query) ||
            username
              .toLowerCase()
              .includes(query) ||
            preview
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      conversations,
      searchQuery,
      user,
    ]);

  const filteredRooms =
    useMemo(() => {
      const query =
        searchQuery.trim().toLowerCase();

      if (!query) {
        return rooms;
      }

      return rooms.filter((room) => {
        const name =
          room.name || "";

        const description =
          room.description || "";

        return (
          name
            .toLowerCase()
            .includes(query) ||
          description
            .toLowerCase()
            .includes(query)
        );
      });
    }, [
      rooms,
      searchQuery,
    ]);

  if (!user) {
    return null;
  }

  const userInitial =
    user.displayName
      ?.charAt(0)
      .toUpperCase() || "B";

  return (
    <div className="messaging-home">
      <header className="messaging-header">
        <div className="messaging-brand">
          <span className="messaging-brand-mark">
            B
          </span>

          <div>
            <strong>Bridgely</strong>

            <span>
              Connect privately
            </span>
          </div>
        </div>

        <div className="messaging-header-actions">
          <button
            className="header-icon-button"
            type="button"
            aria-label="Search"
            onClick={() =>
              document
                .getElementById(
                  "bridgely-search"
                )
                ?.focus()
            }
          >
            ⌕
          </button>

          <ThemeToggle />

          <button
            className="profile-mini"
            type="button"
            onClick={() =>
              setActiveTab("profile")
            }
            aria-label="Open profile"
          >
            {userInitial}
          </button>
        </div>
      </header>

      <main className="messaging-main">
        <section className="messaging-title-row">
          <div>
            <span className="messaging-eyebrow">
              MESSAGES
            </span>

            <h1>
              {activeTab === "chats"
                ? "Your chats"
                : activeTab === "rooms"
                ? "Your rooms"
                : activeTab === "people"
                ? "People"
                : "Your profile"}
            </h1>
          </div>

          {activeTab === "chats" && (
            <button
              className="new-chat-button"
              type="button"
              onClick={() =>
                navigate("/search")
              }
            >
              <span>+</span>
              <span>New chat</span>
            </button>
          )}

          {activeTab === "rooms" && (
            <button
              className="new-chat-button"
              type="button"
              onClick={() =>
                navigate("/rooms")
              }
            >
              <span>+</span>
              <span>Manage rooms</span>
            </button>
          )}

          {activeTab === "people" && (
            <button
              className="new-chat-button"
              type="button"
              onClick={() =>
                navigate("/search")
              }
            >
              <span>⌕</span>
              <span>Find people</span>
            </button>
          )}
        </section>

        {activeTab !== "profile" && (
          <div className="messaging-search">
            <span className="messaging-search-icon">
              ⌕
            </span>

            <input
              id="bridgely-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder={
                activeTab === "rooms"
                  ? "Search your rooms..."
                  : "Search conversations..."
              }
            />

            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() =>
                  setSearchQuery("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        )}

        {activeTab === "chats" && (
          <section className="messaging-section">
            <div className="messaging-section-header">
              <div>
                <span className="messaging-section-label">
                  RECENT
                </span>

                <h2>
                  Conversations
                </h2>
              </div>

              <span className="messaging-count">
                {conversations.length}
              </span>
            </div>

            {loadingConversations ? (
              <div className="messaging-empty">
                <div className="messaging-loader">
                  ◌
                </div>

                <strong>
                  Loading your chats...
                </strong>

                <span>
                  Getting your latest
                  conversations.
                </span>
              </div>
            ) : conversationError ? (
              <div className="messaging-empty messaging-error">
                <div className="messaging-empty-icon">
                  !
                </div>

                <strong>
                  Couldn't load chats
                </strong>

                <span>
                  {conversationError}
                </span>

                <button
                  type="button"
                  onClick={
                    loadConversations
                  }
                  className="messaging-retry"
                >
                  Try again
                </button>
              </div>
            ) : filteredConversations.length ===
              0 ? (
              <div className="messaging-empty">
                <div className="messaging-empty-icon">
                  {searchQuery
                    ? "⌕"
                    : "✦"}
                </div>

                <strong>
                  {searchQuery
                    ? "No chats found"
                    : "No conversations yet"}
                </strong>

                <span>
                  {searchQuery
                    ? "Try another name or username."
                    : "Start a private conversation with someone on Bridgely."}
                </span>

                {!searchQuery && (
                  <button
                    type="button"
                    className="messaging-empty-action"
                    onClick={() =>
                      navigate(
                        "/search"
                      )
                    }
                  >
                    Find someone
                  </button>
                )}
              </div>
            ) : (
              <div className="messaging-list">
                {filteredConversations.map(
                  (conversation) => {
                    const otherUser =
                      getOtherMember(
                        conversation
                      );

                    const online =
                      otherUser
                        ? isUserOnline(
                            otherUser.id
                          )
                        : false;

                    const initial =
                      otherUser?.displayName
                        ?.charAt(0)
                        .toUpperCase() ||
                      "B";

                    return (
                      <button
                        key={
                          conversation.id
                        }
                        type="button"
                        className="message-list-item"
                        onClick={() =>
                          navigate(
                            `/conversation/${conversation.id}`
                          )
                        }
                      >
                        <div className="message-avatar-wrap">
                          <div className="message-avatar">
                            {initial}
                          </div>

                          {online && (
                            <span className="message-online-dot" />
                          )}
                        </div>

                        <div className="message-list-content">
                          <div className="message-list-top">
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

                          <div className="message-list-bottom">
                            <span>
                              {getConversationPreview(
                                conversation
                              )}
                            </span>
                          </div>
                        </div>

                        <span className="message-list-arrow">
                          ›
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === "rooms" && (
          <section className="messaging-section">
            <div className="messaging-section-header">
              <div>
                <span className="messaging-section-label">
                  COMMUNITIES
                </span>

                <h2>
                  Your rooms
                </h2>
              </div>

              <span className="messaging-count">
                {rooms.length}
              </span>
            </div>

            {loadingRooms ? (
              <div className="messaging-empty">
                <div className="messaging-loader">
                  ◌
                </div>

                <strong>
                  Loading your rooms...
                </strong>

                <span>
                  Getting your communities.
                </span>
              </div>
            ) : roomError ? (
              <div className="messaging-empty messaging-error">
                <div className="messaging-empty-icon">
                  !
                </div>

                <strong>
                  Couldn't load rooms
                </strong>

                <span>
                  {roomError}
                </span>

                <button
                  type="button"
                  onClick={loadRooms}
                  className="messaging-retry"
                >
                  Try again
                </button>
              </div>
            ) : filteredRooms.length ===
              0 ? (
              <div className="messaging-empty">
                <div className="messaging-empty-icon">
                  {searchQuery
                    ? "⌕"
                    : "◉"}
                </div>

                <strong>
                  {searchQuery
                    ? "No rooms found"
                    : "No rooms yet"}
                </strong>

                <span>
                  {searchQuery
                    ? "Try another room name."
                    : "Create or join a room to start connecting with a community."}
                </span>

                {!searchQuery && (
                  <button
                    type="button"
                    className="messaging-empty-action"
                    onClick={() =>
                      navigate(
                        "/rooms"
                      )
                    }
                  >
                    Explore rooms
                  </button>
                )}
              </div>
            ) : (
              <div className="messaging-list">
                {filteredRooms.map(
                  (room) => {
                    const initial =
                      room.name
                        ?.charAt(0)
                        .toUpperCase() ||
                      "R";

                    return (
                      <button
                        key={room.id}
                        type="button"
                        className="message-list-item room-list-item"
                        onClick={() =>
                          navigate(
                            `/rooms/${room.id}`
                          )
                        }
                      >
                        <div className="message-avatar room-avatar">
                          {initial}
                        </div>

                        <div className="message-list-content">
                          <div className="message-list-top">
                            <strong>
                              {room.name}
                            </strong>

                            <span
                              className={`room-type-pill ${
                                room.privacy ===
                                "PUBLIC"
                                  ? "room-type-public"
                                  : "room-type-private"
                              }`}
                            >
                              {room.privacy ===
                              "PUBLIC"
                                ? "Public"
                                : "Private"}
                            </span>
                          </div>

                          <div className="message-list-bottom">
                            <span>
                              {room.description ||
                                formatRoomMembers(
                                  room
                                )}
                            </span>
                          </div>
                        </div>

                        <span className="message-list-arrow">
                          ›
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}

            <button
              type="button"
              className="section-full-button"
              onClick={() =>
                navigate("/rooms")
              }
            >
              <span>
                Explore all rooms
              </span>

              <span>→</span>
            </button>
          </section>
        )}

        {activeTab === "people" && (
          <section className="messaging-section">
            <div className="people-intro">
              <div className="people-intro-icon">
                @
              </div>

              <div>
                <span className="messaging-section-label">
                  DISCOVER
                </span>

                <h2>
                  Find people
                </h2>

                <p>
                  Search for someone using
                  their unique Bridgely
                  username.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="people-search-card"
              onClick={() =>
                navigate("/search")
              }
            >
              <div className="people-search-card-icon">
                ⌕
              </div>

              <div>
                <strong>
                  Search Bridgely
                </strong>

                <span>
                  Find people by username
                </span>
              </div>

              <span className="message-list-arrow">
                ›
              </span>
            </button>

            <div className="privacy-small-card">
              <span>
                ✓
              </span>

              <div>
                <strong>
                  Your number stays private
                </strong>

                <p>
                  Connect using usernames
                  instead of phone numbers.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="profile-section">
            <div className="profile-card">
              <div className="profile-large-avatar">
                {userInitial}
              </div>

              <h2>
                {user.displayName}
              </h2>

              <span className="profile-username">
                @{user.username}
              </span>

              <div className="profile-status">
                <span className="profile-status-dot" />
                Active on Bridgely
              </div>
            </div>

            <div className="profile-options">
              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "chats"
                  )
                }
              >
                <span className="profile-option-icon">
                  💬
                </span>

                <div>
                  <strong>
                    Messages
                  </strong>

                  <span>
                    Your private conversations
                  </span>
                </div>

                <span>›</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/rooms")
                }
              >
                <span className="profile-option-icon">
                  ◉
                </span>

                <div>
                  <strong>
                    Rooms
                  </strong>

                  <span>
                    Your communities
                  </span>
                </div>

                <span>›</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/search")
                }
              >
                <span className="profile-option-icon">
                  ⌕
                </span>

                <div>
                  <strong>
                    Find people
                  </strong>

                  <span>
                    Search by username
                  </span>
                </div>

                <span>›</span>
              </button>
            </div>

            <div className="profile-settings-row">
              <div>
                <strong>
                  Appearance
                </strong>

                <span>
                  Change your theme
                </span>
              </div>

              <ThemeToggle />
            </div>

            <button
              type="button"
              className="profile-logout"
              onClick={handleLogout}
            >
              Log out
            </button>

            <div className="profile-privacy-note">
              <span>✓</span>

              <p>
                Bridgely lets you connect
                without exposing your phone
                number.
              </p>
            </div>
          </section>
        )}
      </main>

      <button
        type="button"
        className="mobile-compose-button"
        onClick={() =>
          navigate("/search")
        }
        aria-label="Start a new conversation"
      >
        +
      </button>

      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={
            activeTab === "chats"
              ? "active"
              : ""
          }
          onClick={() => {
            setActiveTab("chats");
            setSearchQuery("");
          }}
        >
          <span className="mobile-nav-icon">
            ◉
          </span>

          <span>Chats</span>
        </button>

        <button
          type="button"
          className={
            activeTab === "rooms"
              ? "active"
              : ""
          }
          onClick={() => {
            setActiveTab("rooms");
            setSearchQuery("");
          }}
        >
          <span className="mobile-nav-icon">
            ◇
          </span>

          <span>Rooms</span>
        </button>

        <button
          type="button"
          className={
            activeTab === "people"
              ? "active"
              : ""
          }
          onClick={() => {
            setActiveTab("people");
            setSearchQuery("");
          }}
        >
          <span className="mobile-nav-icon">
            @
          </span>

          <span>People</span>
        </button>

        <button
          type="button"
          className={
            activeTab === "profile"
              ? "active"
              : ""
          }
          onClick={() => {
            setActiveTab("profile");
            setSearchQuery("");
          }}
        >
          <span className="mobile-nav-avatar">
            {userInitial}
          </span>

          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default Home;

