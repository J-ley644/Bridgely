import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getRoom,
  joinRoom,
  leaveRoom,
  getRoomMessages,
  sendRoomMessage,
} from "../services/api";

import ThemeToggle from "../components/ThemeToggle";
import { connectSocket } from "../services/socket";

function Room() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    const storedUser =
      sessionStorage.getItem("bridgelyUser");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      setCurrentUser(JSON.parse(storedUser));
    } catch {
      sessionStorage.removeItem("bridgelyUser");
      sessionStorage.removeItem("bridgelyToken");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!roomId || !currentUser) {
      return;
    }

    loadRoom();
  }, [roomId, currentUser]);

  async function loadRoom() {
    setLoading(true);
    setError("");

    try {
      const result = await getRoom(roomId);
      setRoom(result.room || null);
    } catch (err) {
      console.error("Load room error:", err);

      setError(
        err.message || "Unable to load this room."
      );
    } finally {
      setLoading(false);
    }
  }

  function isMember() {
    if (!room || !currentUser) {
      return false;
    }

    return room.members?.some(
      (member) =>
        member.userId === currentUser.id
    );
  }

  function isOwner() {
    if (!room || !currentUser) {
      return false;
    }

    return room.creatorId === currentUser.id;
  }

  async function loadMessages() {
    if (!roomId || !currentUser) {
      return;
    }

    setMessagesLoading(true);
    setMessageError("");

    try {
      const result = await getRoomMessages(roomId);

      setMessages(result.messages || []);
    } catch (err) {
      console.error(
        "Load room messages error:",
        err
      );

      setMessageError(
        err.message ||
          "Unable to load room messages."
      );
    } finally {
      setMessagesLoading(false);
    }
  }

  useEffect(() => {
    if (!roomId || !currentUser || !room) {
      return;
    }

    if (!isMember()) {
      setMessages([]);
      return;
    }

    loadMessages();
  }, [roomId, currentUser, room]);

  useEffect(() => {
    if (!roomId || !currentUser || !room) {
      return;
    }

    if (!isMember()) {
      return;
    }

    const token =
      sessionStorage.getItem("bridgelyToken");

    if (!token) {
      return;
    }

    const socket = connectSocket(token);

    socket.emit("join-room", roomId);

    function handleNewMessage(message) {
      if (message.roomId !== roomId) {
        return;
      }

      setMessages((currentMessages) => {
        const exists = currentMessages.some(
          (item) => item.id === message.id
        );

        if (exists) {
          return currentMessages;
        }

        return [...currentMessages, message];
      });
    }

    function handleSocketError(socketError) {
      console.error(
        "Room socket error:",
        socketError
      );
    }

    socket.on(
      "room:message:new",
      handleNewMessage
    );

    socket.on(
      "socket-error",
      handleSocketError
    );

    return () => {
      socket.emit("leave-room", roomId);

      socket.off(
        "room:message:new",
        handleNewMessage
      );

      socket.off(
        "socket-error",
        handleSocketError
      );
    };
  }, [roomId, currentUser, room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function handleJoin() {
    setActionLoading(true);
    setActionError("");

    try {
      await joinRoom(roomId);
      await loadRoom();
    } catch (err) {
      console.error("Join room error:", err);

      setActionError(
        err.message || "Unable to join this room."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    if (isOwner()) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to leave this room?"
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      await leaveRoom(roomId);
      navigate("/rooms");
    } catch (err) {
      console.error("Leave room error:", err);

      setActionError(
        err.message || "Unable to leave this room."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendMessage(event) {
    event?.preventDefault();

    const content = messageText.trim();

    if (!content || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    setMessageError("");

    try {
      const result = await sendRoomMessage(
        roomId,
        content
      );

      /*
       * The server broadcasts the message through
       * Socket.IO. We don't add it here because the
       * socket event will add it once.
       */

      if (result?.data && !result.data.id) {
        console.warn(
          "Room message response did not contain an id."
        );
      }

      setMessageText("");

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (err) {
      console.error(
        "Send room message error:",
        err
      );

      setMessageError(
        err.message ||
          "Unable to send your message."
      );
    } finally {
      setSendingMessage(false);
    }
  }

  function handleMessageKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event);
    }
  }

  function formatMessageTime(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getInitial(user) {
    return (
      user?.displayName
        ?.charAt(0)
        .toUpperCase() ||
      user?.username
        ?.charAt(0)
        .toUpperCase() ||
      "B"
    );
  }

  function getMessageSenderName(message) {
    if (
      message.sender?.id ===
      currentUser?.id
    ) {
      return "You";
    }

    return (
      message.sender?.displayName ||
      message.sender?.username ||
      "Bridgely user"
    );
  }

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="room-page">
        <header className="home-header">
          <div
            className="home-logo"
            onClick={() => navigate("/rooms")}
            style={{ cursor: "pointer" }}
          >
            <span className="brand-mark">
              B
            </span>

            <span>Bridgely</span>
          </div>

          <ThemeToggle />
        </header>

        <main className="room-main">
          <div className="room-loading">
            <div className="empty-circle">
              ◌
            </div>

            <span>
              Loading room...
            </span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="room-page">
        <header className="home-header">
          <div
            className="home-logo"
            onClick={() => navigate("/rooms")}
            style={{ cursor: "pointer" }}
          >
            <span className="brand-mark">
              B
            </span>

            <span>Bridgely</span>
          </div>

          <ThemeToggle />
        </header>

        <main className="room-main">
          <section className="room-error-card">
            <div className="empty-circle">
              !
            </div>

            <h1>
              Unable to open room
            </h1>

            <p>
              {error ||
                "This room could not be found."}
            </p>

            <button
              className="panel-action"
              onClick={() => navigate("/rooms")}
            >
              Back to rooms
              <span>←</span>
            </button>
          </section>
        </main>
      </div>
    );
  }

  const member = isMember();

  return (
    <div className="room-page">
      <header className="home-header">
        <div
          className="home-logo"
          onClick={() => navigate("/rooms")}
          style={{ cursor: "pointer" }}
        >
          <span className="brand-mark">
            B
          </span>

          <span>Bridgely</span>
        </div>

        <div className="room-header-actions">
          <ThemeToggle />

          <button
            className="logout-button"
            onClick={() => navigate("/rooms")}
          >
            Back to rooms
          </button>
        </div>
      </header>

      <main className="room-main">
        <section className="room-shell">
          <div className="room-hero">
            <div className="room-hero-avatar">
              {room.name
                ?.charAt(0)
                .toUpperCase() || "R"}
            </div>

            <div className="room-hero-content">
              <div className="room-hero-topline">
                <span className="section-label">
                  COMMUNITY
                </span>

                <span
                  className={`room-privacy ${
                    room.privacy === "PUBLIC"
                      ? "room-public"
                      : "room-private"
                  }`}
                >
                  {room.privacy === "PUBLIC"
                    ? "Public"
                    : "Private"}
                </span>
              </div>

              <h1>{room.name}</h1>

              <p>
                {room.description ||
                  "No description provided."}
              </p>

              <div className="room-meta">
                <span>
                  {room.members?.length || 0}{" "}
                  {room.members?.length === 1
                    ? "member"
                    : "members"}
                </span>

                <span>•</span>

                <span>
                  {member
                    ? "Member"
                    : "Not a member"}
                </span>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="room-action-error">
              {actionError}
            </div>
          )}

          <div className="room-content-grid">
            <section className="room-chat-panel">
              <div className="room-section-heading">
                <div>
                  <span className="panel-label">
                    ROOM CHAT
                  </span>

                  <h2>
                    Conversation
                  </h2>
                </div>

                {member && (
                  <span className="room-chat-status">
                    ● Live
                  </span>
                )}
              </div>

              {!member ? (
                <div className="room-chat-locked">
                  <div className="empty-circle">
                    🔒
                  </div>

                  <h3>
                    Join the room to chat
                  </h3>

                  <p>
                    You need to be a member of
                    this room before you can view
                    or send messages.
                  </p>

                  {room.privacy === "PUBLIC" && (
                    <button
                      className="room-join-button"
                      onClick={handleJoin}
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Joining..."
                        : "Join room"}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="room-messages-area">
                    {messagesLoading ? (
                      <div className="room-chat-loading">
                        <div className="empty-circle">
                          ◌
                        </div>

                        <span>
                          Loading messages...
                        </span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="room-empty-chat">
                        <div className="empty-circle">
                          💬
                        </div>

                        <h3>
                          No messages yet
                        </h3>

                        <p>
                          Start the conversation
                          with the room.
                        </p>
                      </div>
                    ) : (
                      <div className="room-message-list">
                        {messages.map(
                          (message) => {
                            const mine =
                              message.senderId ===
                              currentUser.id;

                            return (
                              <div
                                className={`room-message-row ${
                                  mine
                                    ? "room-message-row-mine"
                                    : ""
                                }`}
                                key={message.id}
                              >
                                {!mine && (
                                  <div className="room-message-avatar">
                                    {getInitial(
                                      message.sender
                                    )}
                                  </div>
                                )}

                                <div
                                  className={`room-message-content ${
                                    mine
                                      ? "room-message-content-mine"
                                      : ""
                                  }`}
                                >
                                  {!mine && (
                                    <div className="room-message-sender">
                                      {
                                        getMessageSenderName(
                                          message
                                        )
                                      }
                                    </div>
                                  )}

                                  <div
                                    className={`room-message-bubble ${
                                      mine
                                        ? "room-message-bubble-mine"
                                        : "room-message-bubble-other"
                                    }`}
                                  >
                                    {
                                      message.content
                                    }
                                  </div>

                                  <div className="room-message-time">
                                    {formatMessageTime(
                                      message.createdAt
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}

                        <div
                          ref={messagesEndRef}
                        />
                      </div>
                    )}
                  </div>

                  {messageError && (
                    <div className="room-message-error">
                      {messageError}
                    </div>
                  )}

                  <form
                    className="room-message-form"
                    onSubmit={handleSendMessage}
                  >
                    <textarea
                      ref={textareaRef}
                      value={messageText}
                      onChange={(event) =>
                        setMessageText(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleMessageKeyDown
                      }
                      placeholder="Write a message..."
                      rows={1}
                      maxLength={2000}
                      disabled={sendingMessage}
                    />

                    <button
                      type="submit"
                      disabled={
                        sendingMessage ||
                        !messageText.trim()
                      }
                    >
                      {sendingMessage
                        ? "..."
                        : "Send"}
                    </button>
                  </form>
                </>
              )}
            </section>

            <aside className="room-members-panel">
              <div className="room-section-heading">
                <div>
                  <span className="panel-label">
                    MEMBERS
                  </span>

                  <h2>
                    {room.members?.length || 0}
                  </h2>
                </div>
              </div>

              <div className="room-members-list">
                {room.members?.map(
                  (memberItem) => {
                    const memberUser =
                      memberItem.user;

                    return (
                      <div
                        className="room-member"
                        key={memberItem.id}
                      >
                        <div className="room-member-avatar">
                          {getInitial(
                            memberUser
                          )}
                        </div>

                        <div className="room-member-info">
                          <strong>
                            {memberUser?.displayName ||
                              memberUser?.username ||
                              "Bridgely user"}
                          </strong>

                          {memberUser?.username && (
                            <span>
                              @{memberUser.username}
                            </span>
                          )}
                        </div>

                        {memberItem.role ===
                          "OWNER" && (
                          <span className="room-owner-badge">
                            Owner
                          </span>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </aside>
          </div>

          <div className="room-footer-actions">
            {!member &&
              room.privacy === "PUBLIC" && (
                <button
                  className="room-join-button"
                  onClick={handleJoin}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Joining..."
                    : "Join room"}
                </button>
              )}

            {member && !isOwner() && (
              <button
                className="room-leave-button"
                onClick={handleLeave}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Leaving..."
                  : "Leave room"}
              </button>
            )}

            {isOwner() && (
              <span className="room-owner-note">
                You own this room
              </span>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Room;