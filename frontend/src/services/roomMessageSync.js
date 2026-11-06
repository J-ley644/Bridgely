
import { sendRoomMessage } from "./api";

import {
  getPendingOutgoingRoomMessages,
  getCachedRoomMessages,
  cacheRoomMessages,
  removeOutgoingRoomMessage,
} from "./offlineStorage";

const activeSyncs = new Map();

export async function syncPendingRoomMessages(userId) {
  if (!userId || !navigator.onLine) return;

  if (activeSyncs.has(userId)) {
    return activeSyncs.get(userId);
  }

  const syncTask = (async () => {
    try {
      const pendingMessages =
        await getPendingOutgoingRoomMessages(userId);

      for (const queuedMessage of pendingMessages) {
        if (!navigator.onLine) break;

        try {
          const response = await sendRoomMessage(
            queuedMessage.roomId,
            queuedMessage.content,
            queuedMessage.clientMessageId
          );

          const sentMessage = response?.data;

          if (!sentMessage?.id) {
            throw new Error("Room message confirmation was not received.");
          }

          const cachedMessages = await getCachedRoomMessages(
            userId,
            queuedMessage.roomId
          );

          const serverMessages = cachedMessages.filter(
            (message) => !message.localId
          );

          await cacheRoomMessages(
            userId,
            queuedMessage.roomId,
            [
              ...serverMessages.filter(
                (message) => message.id !== sentMessage.id
              ),
              sentMessage,
            ]
          );

          await removeOutgoingRoomMessage(
            userId,
            queuedMessage.localId
          );

          window.dispatchEvent(
            new CustomEvent("bridgely:room-message-sent", {
              detail: {
                roomId: queuedMessage.roomId,
                localId: queuedMessage.localId,
                message: sentMessage,
              },
            })
          );
        } catch (error) {
          console.error("Pending room message sync failed:", error);

          // Leave the message queued for the next retry.
          break;
        }
      }
    } finally {
      activeSyncs.delete(userId);
    }
  })();

  activeSyncs.set(userId, syncTask);

  return syncTask;
}
