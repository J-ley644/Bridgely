
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getConversation,
  getConversationMessages,
  sendConversationMessage,
} from "../services/api";

import {
  cacheMessages,
  getCachedMessages,
  queueOutgoingMessage,
} from "../services/offlineStorage";

import { connectSocket } from "../services/socket";
import { syncPendingMessages } from "../services/messageSync";

function Conversation() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [swipingMessageId, setSwipingMessageId] = useState(null);
  const [swipeDistance, setSwipeDistance] = useState(0);

  const messagesEndRef = useRef(null);
  const otherUserRef = useRef(null);
  const swipeStartRef = useRef(null);
  const messageRefs = useRef({});
  const messagesRef = useRef([]);

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
    if (!conversationId || !user) return;

    loadConversation();
    loadMessages();
  }, [conversationId, user]);

  useEffect(() => {
  messagesRef.current = messages;
}, [messages]);

useEffect(() => {
  if (!user) return;

  const handleMessageSent = (event) => {
    const { conversationId: sentConversationId, localId, message } =
      event.detail || {};

    if (sentConversationId !== conversationId || !message) return;

    const updatedMessages = [
      ...messagesRef.current.filter(
        (item) => item.localId !== localId && item.id !== message.id
      ),
      message,
    ];

    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
  };

  window.addEventListener(
    "bridgely:message-sent",
    handleMessageSent
  );

  syncPendingMessages(user.id);

  return () => {
    window.removeEventListener(
      "bridgely:message-sent",
      handleMessageSent
    );
  };
}, [user, conversationId]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const token = sessionStorage.getItem("bridgelyToken");
    if (!token) return;

    const socket = connectSocket(token);

    function handleConnect() {
      console.log(
        "⚡ Bridgely real-time connection established:",
        socket.id
      );

      socket.emit("join-conversation", conversationId);
    }

    function handleMessage(message) {
  console.log("📨 Real-time message received:", message);

  const alreadyExists = messagesRef.current.some(
    (existingMessage) => existingMessage.id === message.id
  );

  if (alreadyExists) return;

  const updatedMessages = [
    ...messagesRef.current,
    message,
  ];

  messagesRef.current = updatedMessages;
  setMessages(updatedMessages);

  cacheMessages(
    user.id,
    conversationId,
    updatedMessages
  ).catch((error) => {
    console.error("Message caching error:", error);
  });
}

    function handlePresenceUpdate(presence) {
      const currentOtherUser = otherUserRef.current;

      if (
        !currentOtherUser ||
        presence.userId !== currentOtherUser.id
      ) {
        return;
      }

      setOtherUserOnline(presence.status === "online");
    }

    function handleSocketError(socketError) {
      console.error("Socket error:", socketError);

      setError(
        socketError?.message || "Real-time connection error."
      );
    }

    function handleDisconnect() {
      console.log("⚡ Bridgely real-time connection closed");
      setOtherUserOnline(false);
    }

    socket.on("connect", handleConnect);
    socket.on("message:new", handleMessage);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("socket-error", handleSocketError);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) handleConnect();

    return () => {
      socket.emit("leave-conversation", conversationId);

      socket.off("connect", handleConnect);
      socket.off("message:new", handleMessage);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("socket-error", handleSocketError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function loadConversation() {
    try {
      const result = await getConversation(conversationId);
      const conversation = result.conversation;

      const participant = conversation?.members?.find(
        (member) => member.userId !== user.id
      )?.user;

      setOtherUser(participant || null);
      otherUserRef.current = participant || null;
    } catch (err) {
      console.error("Load conversation details error:", err);

      setError(
        err.message || "Unable to load conversation details."
      );
    }
  }

  async function loadMessages() {
  setError("");

  let hasCachedMessages = false;

  try {
    const cached = await getCachedMessages(
      user.id,
      conversationId
    );

    if (cached.length > 0) {
      messagesRef.current = cached;
      setMessages(cached);
      hasCachedMessages = true;
      setLoading(false);
    }
  } catch (err) {
    console.error("Offline messages error:", err);
  }

  try {
    const result = await getConversationMessages(conversationId);
    const latestMessages = result.messages || [];

    messagesRef.current = latestMessages;
    setMessages(latestMessages);

    await cacheMessages(
      user.id,
      conversationId,
      latestMessages
    );
  } catch (err) {
    console.error("Load conversation error:", err);

    if (!hasCachedMessages) {
      setError(
        err.message || "Unable to load this conversation."
      );
    }
  } finally {
    setLoading(false);
  }
}

  function handleSwipeStart(event, message) {
    if (event.button !== undefined && event.button !== 0) return;

    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      message,
    };

    setSwipingMessageId(message.id);
  }

  function handleSwipeMove(event) {
    if (!swipeStartRef.current) return;

    const deltaX = event.clientX - swipeStartRef.current.x;
    const deltaY = event.clientY - swipeStartRef.current.y;

    if (Math.abs(deltaY) > 45) {
      setSwipeDistance(0);
      return;
    }

    if (deltaX > 0) {
      setSwipeDistance(Math.min(deltaX, 90));
    }
  }

  function handleSwipeEnd() {
    if (!swipeStartRef.current) return;

    if (swipeDistance >= 55) {
      setReplyTo(swipeStartRef.current.message);
    }

    swipeStartRef.current = null;
    setSwipingMessageId(null);
    setSwipeDistance(0);
  }

  function cancelReply() {
    setReplyTo(null);
  }

  function jumpToMessage(messageId) {
    const element = messageRefs.current[messageId];

    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function handleSubmit(event) {
  event.preventDefault();

  const cleanContent = content.trim();

  if (!cleanContent || sending || !user) return;

  setSending(true);
  setError("");

  const clientMessageId =
    `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const messageReplyToId = replyTo?.id || null;

  try {
    if (!navigator.onLine) {
      throw new Error("OFFLINE");
    }

    const result = await sendConversationMessage(
      conversationId,
      cleanContent,
      messageReplyToId,
      clientMessageId
    );

    if (!result?.data?.id) {
      throw new Error("Message delivery was not confirmed.");
    }

    const updatedMessages = [
      ...messagesRef.current.filter(
        (message) => message.id !== result.data.id
      ),
      result.data,
    ];

    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);

    await cacheMessages(
      user.id,
      conversationId,
      updatedMessages
    );

    setContent("");
    setReplyTo(null);
  } catch (err) {
    try {
      await queueOutgoingMessage({
        userId: user.id,
        conversationId,
        senderId: user.id,
        content: cleanContent,
        replyToId: messageReplyToId,
        clientMessageId,
      });

      const cached = await getCachedMessages(
        user.id,
        conversationId
      );

      messagesRef.current = cached;
      setMessages(cached);

      setContent("");
      setReplyTo(null);

      if (navigator.onLine) {
        syncPendingMessages(user.id);
      }
    } catch (queueError) {
      console.error("Message saving failed:", queueError);
      setError("Message could not be saved. Please try again.");
    }
  } finally {
    setSending(false);
  }
}

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!user) return null;

  const otherUserInitial =
    otherUser?.displayName?.charAt(0).toUpperCase() || "B";

  function getMessageSender(message) {
    return message.senderId === user.id
      ? "You"
      : otherUser?.displayName || "User";
  }

  function getReplyContent(message) {
    return message?.content || "Message";
  }

  return (
    <div className="conversation-page">
      <header className="conversation-header">
        <Link to="/home" className="home-logo">
          <span className="brand-mark">B</span>
          <span>Bridgely</span>
        </Link>

        <button
          className="conversation-back"
          onClick={() => navigate("/home")}
        >
          ← Back
        </button>
      </header>

      <main className="conversation-main">
        <section className="conversation-shell">
          <div className="conversation-title">
            <div className="conversation-avatar">
              {otherUserInitial}
            </div>

            <div>
              <span className="section-label">
                PRIVATE CHAT
              </span>

              <h1>
                {otherUser?.displayName || "Conversation"}
              </h1>

              {otherUser?.username && (
                <span className="conversation-username">
                  @{otherUser.username}
                </span>
              )}

              {otherUser && (
                <div className="conversation-presence">
                  <span
                    className={`presence-dot ${
                      otherUserOnline
                        ? "presence-online"
                        : "presence-offline"
                    }`}
                  />

                  <span>
                    {otherUserOnline ? "Online" : "Offline"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <div className="messages-area">
            {loading ? (
              <div className="messages-empty">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="messages-empty">
                <div className="empty-circle">◌</div>

                <strong>No messages yet</strong>

                <p>Start the conversation.</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message.senderId === user.id;
                const isSwiping =
                  swipingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    ref={(element) => {
                      messageRefs.current[message.id] = element;
                    }}
                    className={`message-row ${
                      isMine
                        ? "message-row-mine"
                        : "message-row-other"
                    }`}
                    onPointerDown={(event) =>
                      handleSwipeStart(event, message)
                    }
                    onPointerMove={handleSwipeMove}
                    onPointerUp={handleSwipeEnd}
                    onPointerCancel={handleSwipeEnd}
                    style={{
                      touchAction: "pan-y",
                    }}
                  >
                    <div
                      className="message-swipe-indicator"
                      style={{
                        opacity: isSwiping
                          ? Math.min(swipeDistance / 55, 1)
                          : 0,
                        transform: `scale(${
                          isSwiping
                            ? 0.7 + Math.min(swipeDistance / 55, 1) * 0.3
                            : 0.7
                        })`,
                      }}
                    >
                      <span>↩</span>
                    </div>

                    <div
                      className={`message-bubble ${
                        isMine
                          ? "message-bubble-mine"
                          : "message-bubble-other"
                      }`}
                      style={{
                        transform: isSwiping
                          ? `translateX(${swipeDistance}px)`
                          : "translateX(0)",
                        transition: isSwiping
                          ? "none"
                          : "transform 0.2s ease",
                      }}
                    >
                      {message.replyTo && (
                        <div
                          className="message-reply-reference"
                          onClick={() =>
                            jumpToMessage(message.replyTo.id)
                          }
                        >
                          <strong>
                            {message.replyTo.sender?.displayName || "Reply"}
                          </strong>
                          <p>
                            {getReplyContent(message.replyTo)}
                          </p>
                        </div>
                      )}

                      <p>{message.content}</p>

                      <span>
                        {new Date(
                          message.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="message-form"
            onSubmit={handleSubmit}
          >
            {replyTo && (
              <div className="reply-composer-preview">
                <div className="reply-composer-content">
                  <span>Replying to {getMessageSender(replyTo)}</span>

                  <p>{getReplyContent(replyTo)}</p>
                </div>

                <button
                  type="button"
                  className="reply-cancel-button"
                  onClick={cancelReply}
                  aria-label="Cancel reply"
                >
                  ×
                </button>
              </div>
            )}

            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                replyTo ? "Write your reply..." : "Write a message..."
              }
              rows="1"
              disabled={sending}
            />

            <button
              type="submit"
              className="message-send-button"
              disabled={sending || !content.trim()}
            >
              {sending ? "Sending..." : "Send"}

              {!sending && <span>→</span>}
            </button>
          </form>

          <div className="conversation-privacy">
            <span>✓</span>

            <p>
              Private conversation. Your phone number is never shared.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Conversation;
