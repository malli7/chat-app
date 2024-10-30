"use client";
import { db as database } from "./firebaseConfig";
import { ref, push, onValue, get } from "firebase/database";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
type Message = {
  receiverId: string;
  senderId: string
  senderName:string
  text:string
  timestamp: number;
};

const Chat = () => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverEmail, setReceiverEmail] = useState(""); // Step 1: Receiver email
  const [receiverId, setReceiverId] = useState(""); // Store receiver ID
  const [chatId, setChatId] = useState(""); // Store chat ID
  const [isReceiverSet, setIsReceiverSet] = useState(false); // Flag to check if receiver is set

  const generateChatId = (userId: string, receiverId: string) => {
    return [userId, receiverId].sort().join("_"); // Sort IDs to ensure consistent order
  };

  const startChat = async () => {
    if (!receiverEmail) return;

    try {
      // Call the API to get the receiver's ID by email
      const res = await fetch("/api/getreceiverid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: receiverEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        const receiverId = data.receiverId;
         // Check if the users are friends
    const friendRef = ref(database, `users/${user?.id}/friends/${receiverId}`);
    const snapshot = await get(friendRef);

    if (!snapshot.exists()) {
      console.error("You are not friends with this user");
      return; // Prevent chat if they are not friends
    }
        // Generate chatId using both users' IDs
        const chatId = generateChatId(user?.id || "", receiverId);
        setReceiverId(receiverId);
        setChatId(chatId);
        setIsReceiverSet(true); // Move to chat window
        loadMessages(chatId); // Load previous chat messages (if any)
      } else {
        console.error("Receiver not found");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const loadMessages = (chatId: string) => {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messageList = data ? Object.values(data) : [];
      console.log(messageList);
      setMessages(messageList as Message[]);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Reference to the chat in Firebase
    const messagesRef = ref(database, `chats/${chatId}/messages`);

    // Push the new message to Firebase
    await push(messagesRef, {
      text: newMessage,
      senderId: user?.id,
      senderName: user?.fullName,
      receiverId: receiverId,
      timestamp: Date.now(),
    });

    setNewMessage(""); // Clear the input field after sending the message
  };

  return (
    <div>
      {!isReceiverSet ? (
        <div>
          <h2>Enter Receiver Email to Start Chat</h2>
          <input
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
            placeholder="Receiver's email"
          />
          <button onClick={startChat}>Start Chat</button>
        </div>
      ) : (
        <div>
          <div style={{ height: "400px", overflowY: "scroll" }}>
            {messages.map((msg: Message, index) => (
              <div key={index}>
                <strong>{msg.senderName}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
};

export default Chat;
