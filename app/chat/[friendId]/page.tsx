"use client";
import { db as database } from "../../firebaseConfig";
import { ref, push, onValue, get, remove } from "firebase/database";
import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Message = {
  receiverId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  id: string;
};

export default function Component() {
  const { user } = useUser();
  const router = useRouter();
  const { friendId } = useParams();
  const [friend, setFriend] = useState<{
    id: string;
    name: string;
    email: string;
    photoUrl: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getFriendDetails = async () => {
      const res = await fetch("/api/getFriendDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendIds: [friendId] }),
      });
      const result = await res.json();
      setFriend(result.friends[0]);
    };
    getFriendDetails();
  }, [user?.id,friendId]);

  useEffect(() => {
    if (friendId) {
      startChat(typeof friendId === "string" ? friendId : friendId[0]);
    }
  }, [friendId]);

  const generateChatId = (userId: string, receiverId: string) => {
    return [userId, receiverId].sort().join("_");
  };

  const startChat = async (receiverId: string) => {
    if (!receiverId) return;

    const friendRef = ref(database, `users/${user?.id}/friends/${receiverId}`);
    const snapshot = await get(friendRef);

    if (!snapshot.exists()) {
      console.error("You are not friends with this user");
      router.push("/");
      return;
    }

    const chatId = generateChatId(user?.id || "", receiverId);
    setChatId(chatId);
    loadMessages(chatId);
  };

  const loadMessages = (chatId: string) => {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messageList: Message[] = data
        ? Object.entries(data).map(([id, messageData]) => ({
            id,
            ...(messageData as Omit<Message, "id">),
          }))
        : [];
      setMessages(messageList);
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    await push(messagesRef, {
      text: newMessage,
      senderId: user?.id,
      senderName: user?.fullName,
      receiverId: friendId,
      timestamp: Date.now(),
    });

    setNewMessage("");
  };

  // Scroll to the bottom whenever messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  const deleteMessage = async (id: string) => {
    const messageRef = ref(database, `chats/${chatId}/messages/${id}`);
    await remove(messageRef);
    setMessages(messages.filter((message) => message.id !== id));
  };

  return (
    <div className="flex flex-col h-screen mx-auto bg-[#0B141A] text-white">
      <header className="bg-card shadow-sm p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend?.photoUrl} alt="Alice" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <h1 className="ml-3 text-xl font-semibold">{friend?.name}</h1>
      </header>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`relative group flex ${
                msg.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-2 ${
                  msg.senderId === user?.id ? "bg-[#005C4B]" : "bg-[#1F2C34]"
                }`}
              >
                <p className="text-sm break-words">{msg.text}</p>
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {msg.senderId === user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute opacity-0 group-hover:opacity-100">
                      <MoreVertical className="right-2 my-2 top-2 h-4 w-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => deleteMessage(msg.id)}>
                      Delete Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <footer className="bg-[#1F2C34] p-2">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-grow bg-[#2A3942] border-none text-white placeholder-gray-400"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-[#00A884] hover:bg-[#00A884]/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
