
const DB_NAME = "bridgely_offline";
const DB_VERSION = 3;

const STORES = {
  conversations: "conversations",
  messages: "messages",
  outgoing: "outgoing",
  rooms: "rooms",
  roomMessages: "roomMessages",
  roomOutgoing: "roomOutgoing",
};

let databasePromise = null;

function openDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported on this device."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.conversations)) {
        const store = db.createObjectStore(STORES.conversations, {
          keyPath: ["userId", "id"],
        });
        store.createIndex("byUser", "userId");
      }

      if (!db.objectStoreNames.contains(STORES.messages)) {
        const store = db.createObjectStore(STORES.messages, {
          keyPath: ["userId", "id"],
        });
        store.createIndex("byUser", "userId");
        store.createIndex("byConversation", [
          "userId",
          "conversationId",
        ]);
      }

      if (!db.objectStoreNames.contains(STORES.outgoing)) {
        const store = db.createObjectStore(STORES.outgoing, {
          keyPath: ["userId", "localId"],
        });
        store.createIndex("byUser", "userId");
        store.createIndex("byConversation", [
          "userId",
          "conversationId",
        ]);
      }

      if (!db.objectStoreNames.contains(STORES.rooms)) {
        const store = db.createObjectStore(STORES.rooms, {
          keyPath: ["userId", "id"],
        });
        store.createIndex("byUser", "userId");
      }

      if (!db.objectStoreNames.contains(STORES.roomMessages)) {
        const store = db.createObjectStore(STORES.roomMessages, {
          keyPath: ["userId", "id"],
        });
        store.createIndex("byUser", "userId");
        store.createIndex("byRoom", ["userId", "roomId"]);
      }

      if (!db.objectStoreNames.contains(STORES.roomOutgoing)) {
        const store = db.createObjectStore(STORES.roomOutgoing, {
          keyPath: ["userId", "localId"],
        });
        store.createIndex("byUser", "userId");
        store.createIndex("byRoom", ["userId", "roomId"]);
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        databasePromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      databasePromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("Offline database upgrade is blocked."));
    };
  });

  return databasePromise;
}

async function performTransaction(storeName, mode, operation) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    let result;

    try {
      result = operation(store);
    } catch (error) {
      reject(error);
      return;
    }

    transaction.oncomplete = () => resolve(result?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function getAllFromIndex(storeName, indexName, key) {
  return performTransaction(storeName, "readonly", (store) => {
    return store.index(indexName).getAll(key);
  });
}

function createLocalId() {
  return `local_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function sortMessages(messages) {
  return messages.sort((a, b) => {
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });
}

// CONVERSATIONS

export async function cacheConversations(userId, conversations) {
  if (!userId || !Array.isArray(conversations)) return;

  await performTransaction(STORES.conversations, "readwrite", (store) => {
    conversations.forEach((conversation) => {
      if (!conversation?.id) return;

      store.put({
        ...conversation,
        userId,
        cachedAt: new Date().toISOString(),
      });
    });
  });
}

export async function getCachedConversations(userId) {
  if (!userId) return [];

  const conversations = await getAllFromIndex(
    STORES.conversations,
    "byUser",
    userId
  );

  return conversations.sort((a, b) => {
    return new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0);
  });
}

// ROOMS

export async function cacheRooms(userId, rooms) {
  if (!userId || !Array.isArray(rooms)) return;

  await performTransaction(STORES.rooms, "readwrite", (store) => {
    rooms.forEach((room) => {
      if (!room?.id) return;

      store.put({
        ...room,
        userId,
        cachedAt: new Date().toISOString(),
      });
    });
  });
}

export async function getCachedRooms(userId) {
  if (!userId) return [];

  const rooms = await getAllFromIndex(
    STORES.rooms,
    "byUser",
    userId
  );

  return rooms.sort((a, b) => {
    return new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0);
  });
}

// DIRECT MESSAGES

export async function cacheMessages(userId, conversationId, messages) {
  if (!userId || !conversationId || !Array.isArray(messages)) return;

  await performTransaction(STORES.messages, "readwrite", (store) => {
    messages.forEach((message) => {
      if (!message?.id) return;

      store.put({
        ...message,
        userId,
        conversationId,
      });
    });
  });
}

export async function getCachedMessages(userId, conversationId) {
  if (!userId || !conversationId) return [];

  const [cachedMessages, queuedMessages] = await Promise.all([
    getAllFromIndex(
      STORES.messages,
      "byConversation",
      [userId, conversationId]
    ),
    getAllFromIndex(
      STORES.outgoing,
      "byConversation",
      [userId, conversationId]
    ),
  ]);

  return sortMessages([...cachedMessages, ...queuedMessages]);
}

export async function queueOutgoingMessage({
  userId,
  conversationId,
  senderId,
  content,
  replyToId = null,
  clientMessageId = null,
}) {
  if (!userId || !conversationId || !content?.trim()) {
    throw new Error("Missing information for offline message.");
  }

  const localId = clientMessageId || createLocalId();

  const message = {
    id: localId,
    localId,
    clientMessageId: localId,
    userId,
    conversationId,
    senderId,
    content: content.trim(),
    replyToId,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  await performTransaction(STORES.outgoing, "readwrite", (store) => {
    store.put(message);
  });

  return message;
}

export async function getPendingOutgoingMessages(userId) {
  if (!userId) return [];

  const messages = await getAllFromIndex(
    STORES.outgoing,
    "byUser",
    userId
  );

  const pendingMessages = messages
    .filter((message) => message.status === "pending")
    .sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  for (const message of pendingMessages) {
    if (!message.clientMessageId) {
      await updateOutgoingMessage(userId, message.localId, {
        id: message.localId,
        clientMessageId: message.localId,
      });
    }
  }

  return pendingMessages.map((message) => ({
    ...message,
    id: message.localId,
    clientMessageId: message.clientMessageId || message.localId,
  }));
}

export async function updateOutgoingMessage(userId, localId, updates) {
  if (!userId || !localId) return;

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.outgoing, "readwrite");
    const store = transaction.objectStore(STORES.outgoing);
    const request = store.get([userId, localId]);

    request.onsuccess = () => {
      if (!request.result) return;

      store.put({
        ...request.result,
        ...updates,
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function removeOutgoingMessage(userId, localId) {
  if (!userId || !localId) return;

  await performTransaction(STORES.outgoing, "readwrite", (store) => {
    store.delete([userId, localId]);
  });
}

// ROOM MESSAGES

export async function cacheRoomMessages(userId, roomId, messages) {
  if (!userId || !roomId || !Array.isArray(messages)) return;

  await performTransaction(STORES.roomMessages, "readwrite", (store) => {
    messages.forEach((message) => {
      if (!message?.id) return;

      store.put({
        ...message,
        userId,
        roomId,
      });
    });
  });
}

export async function getCachedRoomMessages(userId, roomId) {
  if (!userId || !roomId) return [];

  const [cachedMessages, queuedMessages] = await Promise.all([
    getAllFromIndex(
      STORES.roomMessages,
      "byRoom",
      [userId, roomId]
    ),
    getAllFromIndex(
      STORES.roomOutgoing,
      "byRoom",
      [userId, roomId]
    ),
  ]);

  return sortMessages([...cachedMessages, ...queuedMessages]);
}

export async function queueOutgoingRoomMessage({
  userId,
  roomId,
  senderId,
  content,
  clientMessageId = null,
}) {
  if (!userId || !roomId || !content?.trim()) {
    throw new Error("Missing information for offline room message.");
  }

  const localId = clientMessageId || createLocalId();

  const message = {
    id: localId,
    localId,
    clientMessageId: localId,
    userId,
    roomId,
    senderId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  await performTransaction(STORES.roomOutgoing, "readwrite", (store) => {
    store.put(message);
  });

  return message;
}

export async function getPendingOutgoingRoomMessages(userId) {
  if (!userId) return [];

  const messages = await getAllFromIndex(
    STORES.roomOutgoing,
    "byUser",
    userId
  );

  return messages
    .filter((message) => message.status === "pending")
    .sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    })
    .map((message) => ({
      ...message,
      id: message.localId,
      clientMessageId: message.clientMessageId || message.localId,
    }));
}

export async function removeOutgoingRoomMessage(userId, localId) {
  if (!userId || !localId) return;

  await performTransaction(STORES.roomOutgoing, "readwrite", (store) => {
    store.delete([userId, localId]);
  });
}
