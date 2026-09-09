import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createRoom,
  getMyRooms,
} from "../services/api";

import ThemeToggle from "../components/ThemeToggle";

function Rooms() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC");

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoading(true);
    setError("");

    try {
      const result = await getMyRooms();
      setRooms(result.rooms || []);
    } catch (err) {
      console.error("Load rooms error:", err);
      setError(
        err.message || "Unable to load your rooms."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(event) {
    event.preventDefault();

    if (!name.trim()) {
      setCreateError("Room name is required.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const result = await createRoom({
        name,
        description,
        privacy,
      });

      const newRoom = result.room;

      setRooms((current) => [
        newRoom,
        ...current,
      ]);

      setName("");
      setDescription("");
      setPrivacy("PUBLIC");
      setShowCreate(false);

      navigate(`/rooms/${newRoom.id}`);
    } catch (err) {
      console.error("Create room error:", err);

      setCreateError(
        err.message || "Unable to create room."
      );
    } finally {
      setCreating(false);
    }
  }

  function getMemberCount(room) {
    return room._count?.members || room.members?.length || 0;
  }

  return (
    <div className="home-page rooms-page">
      <header className="home-header">
        <div
          className="home-logo"
          onClick={() => navigate("/home")}
          style={{ cursor: "pointer" }}
        >
          <span className="brand-mark">B</span>
          <span>Bridgely</span>
        </div>

        <div className="rooms-header-actions">
          <ThemeToggle />

          <button
            className="logout-button"
            onClick={() => navigate("/home")}
          >
            Back home
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="welcome-section">
          <span className="section-label">
            COMMUNITIES
          </span>

          <h1>
            Find your <span>room</span>.
          </h1>

          <p>
            Join communities around shared interests,
            conversations, and ideas.
          </p>
        </section>

        <section className="rooms-toolbar">
          <div>
            <span className="panel-label">
              YOUR ROOMS
            </span>

            <h2>
              {rooms.length}{" "}
              {rooms.length === 1
                ? "room"
                : "rooms"}
            </h2>
          </div>

          <button
            className="panel-action"
            onClick={() => {
              setShowCreate(true);
              setCreateError("");
            }}
          >
            Create room
            <span>+</span>
          </button>
        </section>

        {showCreate && (
          <section className="room-create-panel">
            <div className="room-create-header">
              <div>
                <span className="panel-label">
                  NEW COMMUNITY
                </span>

                <h2>Create a room</h2>
              </div>

              <button
                className="room-close-button"
                onClick={() => setShowCreate(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div className="room-form-field">
                <label htmlFor="room-name">
                  Room name
                </label>

                <input
                  id="room-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Nairobi Developers"
                  maxLength={100}
                />
              </div>

              <div className="room-form-field">
                <label htmlFor="room-description">
                  Description
                </label>

                <textarea
                  id="room-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="What is this room about?"
                  maxLength={500}
                  rows={4}
                />
              </div>

              <div className="room-form-field">
                <label>Privacy</label>

                <div className="room-privacy-options">
                  <button
                    type="button"
                    className={`room-privacy-option ${
                      privacy === "PUBLIC"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setPrivacy("PUBLIC")
                    }
                  >
                    <strong>Public</strong>

                    <span>
                      Anyone can discover and join.
                    </span>

                    <small>
                      Up to 2,000 members
                    </small>
                  </button>

                  <button
                    type="button"
                    className={`room-privacy-option ${
                      privacy === "PRIVATE"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setPrivacy("PRIVATE")
                    }
                  >
                    <strong>Private</strong>

                    <span>
                      Members join through
                      invitations or approval.
                    </span>

                    <small>
                      Up to 1,300 members
                    </small>
                  </button>
                </div>
              </div>

              {createError && (
                <div className="room-form-error">
                  {createError}
                </div>
              )}

              <button
                type="submit"
                className="room-create-submit"
                disabled={creating}
              >
                {creating
                  ? "Creating room..."
                  : "Create room"}
              </button>
            </form>
          </section>
        )}

        {loading ? (
          <div className="empty-conversations rooms-empty">
            <div className="empty-circle">
              ◌
            </div>

            <span>
              Loading your rooms...
            </span>
          </div>
        ) : error ? (
          <div className="empty-conversations rooms-empty">
            <div className="empty-circle">
              !
            </div>

            <span>{error}</span>

            <button
              className="panel-action"
              onClick={loadRooms}
            >
              Try again
              <span>↻</span>
            </button>
          </div>
        ) : rooms.length === 0 ? (
          <section className="rooms-empty-state">
            <div className="empty-circle">
              ◉
            </div>

            <h2>
              Your rooms will appear here.
            </h2>

            <p>
              Create your first community and
              start bringing people together.
            </p>

            <button
              className="panel-action"
              onClick={() =>
                setShowCreate(true)
              }
            >
              Create your first room
              <span>+</span>
            </button>
          </section>
        ) : (
          <section className="rooms-grid">
            {rooms.map((room) => (
              <button
                key={room.id}
                className="room-card"
                onClick={() =>
                  navigate(
                    `/rooms/${room.id}`
                  )
                }
              >
                <div className="room-card-top">
                  <div className="room-card-avatar">
                    {room.name
                      ?.charAt(0)
                      .toUpperCase() || "R"}
                  </div>

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

                <div className="room-card-content">
                  <h3>{room.name}</h3>

                  <p>
                    {room.description ||
                      "No description provided."}
                  </p>
                </div>

                <div className="room-card-footer">
                  <span>
                    {getMemberCount(room)}{" "}
                    {getMemberCount(room) === 1
                      ? "member"
                      : "members"}
                  </span>

                  <span>→</span>
                </div>
              </button>
            ))}
          </section>
        )}

        <section className="privacy-banner">
          <div className="privacy-mark">
            ✓
          </div>

          <div>
            <strong>
              Connect without sharing your number.
            </strong>

            <p>
              Bridgely rooms let communities connect
              through usernames while keeping phone
              numbers private.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Rooms;