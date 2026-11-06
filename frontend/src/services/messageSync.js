import { sendConversationMessage } from "./api";

import {
  getPendingOutgoingMessages,
  getCachedMessages,
  cacheMessages,
  removeOutgoingMessage,
} from "./offlineStorage";

const activeSyncs = new Map();

export async function syncPendingMessages(userId) {
  if (!userId || !navigator.onLine) return;

  if (activeSyncs.has(userId)) {
    return activeSyncs.get(userId);
  }

  const syncTask = (async () => {
    try {
      const pendingMessages =
        await getPendingOutgoingMessages(userId);

      for (const queuedMessage of pendingMessages) {
        if (!navigator.onLine) break;

        try {
          const response = await sendConversationMessage(
            queuedMessage.conversationId,
            queuedMessage.content,
            queuedMessage.replyToId,
            queuedMessage.clientMessageId
          );

          const sentMessage = response?.data;

          if (!sentMessage?.id) {
            throw new Error("Message confirmation was not received.");
          }

          const cachedMessages = await getCachedMessages(
            userId,
            queuedMessage.conversationId
          );

          const serverMessages = cachedMessages.filter(
            (message) => !message.localId
          );

          await cacheMessages(
            userId,
            queuedMessage.conversationId,
            [
              ...serverMessages.filter(
                (message) => message.id !== sentMessage.id
              ),
              sentMessage,
            ]
          );

          await removeOutgoingMessage(
            userId,
            queuedMessage.localId
          );

          window.dispatchEvent(
            new CustomEvent("bridgely:message-sent", {
              detail: {
                conversationId: queuedMessage.conversationId,
                localId: queuedMessage.localId,
                message: sentMessage,
              },
            })
          );
        } catch (error) {
          console.error(
            "Pending message sync failed:",
            error
          );

          // Stop here; retry when connectivity returns.
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