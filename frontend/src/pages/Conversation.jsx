import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getConversation,
  getConversationMessages,
  sendConversationMessage,
} from "../services/api";

function Conversation() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

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
    if (!conversationId || !user) {
      return;
    }

    loadConversation();
    loadMessages();
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function loadConversation() {
    try {
      const result =
        await getConversation(
          conversationId
        );

      const conversation =
        result.conversation;

      const participant =
        conversation?.members?.find(
          (member) =>
            member.userId !== user.id
        )?.user;

      setOtherUser(participant || null);
    } catch (err) {
      console.error(
        "Load conversation details error:",
        err
      );

      setError(
        err.message ||
          "Unable to load conversation details."
      );
    }
  }

  async function loadMessages() {
    setLoading(true);
    setError("");

    try {
      const result =
        await getConversationMessages(
          conversationId
        );

      setMessages(result.messages || []);
    } catch (err) {
      console.error(
        "Load conversation error:",
        err
      );

      setError(
        err.message ||
          "Unable to load this conversation."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanContent = content.trim();

    if (!cleanContent || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const result =
        await sendConversationMessage(
          conversationId,
          cleanContent
        );

      if (result.data) {
        setMessages((current) => [
          ...current,
          result.data,
        ]);
      }

      setContent("");
    } catch (err) {
      console.error(
        "Send message error:",
        err
      );

      setError(
        err.message ||
          "Unable to send your message."
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!user) {
    return null;
  }

  const otherUserInitial =
    otherUser?.displayName
      ?.charAt(0)
      .toUpperCase() || "B";

  return (
    <div className="conversation-page">
      <header className="conversation-header">
        <Link
          to="/home"
          className="home-logo"
        >
          <span className="brand-mark">
            B
          </span>

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
                {otherUser?.displayName ||
                  "Conversation"}
              </h1>

              {otherUser?.username && (
                <span className="conversation-username">
                  @{otherUser.username}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="messages-area">
            {loading ? (
              <div className="messages-empty">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="messages-empty">
                <div className="empty-circle">
                  ◌
                </div>

                <strong>
                  No messages yet
                </strong>

                <p>
                  Start the conversation.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine =
                  message.senderId ===
                  user.id;

                return (
                  <div
                    key={message.id}
                    className={`message-row ${
                      isMine
                        ? "message-row-mine"
                        : "message-row-other"
                    }`}
                  >
                    <div
                      className={`message-bubble ${
                        isMine
                          ? "message-bubble-mine"
                          : "message-bubble-other"
                      }`}
                    >
                      <p>
                        {message.content}
                      </p>

                      <span>
                        {new Date(
                          message.createdAt
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
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
            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              rows="1"
              disabled={sending}
            />

            <button
              type="submit"
              className="message-send-button"
              disabled={
                sending ||
                !content.trim()
              }
            >
              {sending
                ? "Sending..."
                : "Send"}

              {!sending && (
                <span>→</span>
              )}
            </button>
          </form>

          <div className="conversation-privacy">
            <span>✓</span>

            <p>
              Private conversation. Your phone
              number is never shared.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Conversation;