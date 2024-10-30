"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { db as database } from "./firebaseConfig";
import { ref, set, onValue, remove } from "firebase/database";

export default function ChatHome() {
  const { user } = useUser();
  const router = useRouter();

  const [friends, setFriends] = useState<
    {
      id: string;
      name: string;
      email: string;
      photoUrl: string;
    }[]
  >([]);
  const [friendRequests, setFriendRequests] = useState<
    { userId: string; name: string }[]
  >([]);
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const friendsRef = ref(database, `users/${user?.id}/friends`);
    onValue(friendsRef, async (snapshot) => {
      const data = snapshot.val();
      const friendsList = data ? Object.keys(data) : [];

      if (friendsList.length > 0) {
        // Fetch friend details via API
        const res = await fetch("/api/getFriendDetails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendIds: friendsList }),
        });

        const result = await res.json();

        if (res.ok) {
          setFriends(result.friends); // Set friend details
        } else {
          console.error("Failed to fetch friend details");
        }
      }
    });
  }, [user?.id]);

  // Load received friend requests
  useEffect(() => {
    const requestsRef = ref(
      database,
      `users/${user?.id}/friendRequests/received`
    );
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      const requestsList: [string, { name: string }][] = data
        ? Object.entries(data)
        : []; // Get the userId and name
      console.log(requestsList);
      // Convert to an array of objects { userId, name }
      const formattedRequests = requestsList.map(([userId, requestData]) => ({
        userId,
        name: requestData.name,
      }));

      setFriendRequests(formattedRequests);
    });
  }, [user?.id]);

  // Redirect to chat page on friend click
  const goToChat = (friendId: string) => {
    router.push(`/chat/${friendId}`); // Navigate to chat page with friendId as parameter
  };

  // Send a friend request
  const sendFriendRequest = async () => {
    if (!newFriendEmail.trim()) return;

    // Fetch the receiver ID by email
    const res = await fetch("/api/getreceiverid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: newFriendEmail }),
    });
    const data = await res.json();

    if (res.ok) {
      const receiverId = data.receiverId;

      // Add friend request in both users' entries, along with the sender's name
      const userRef = ref(
        database,
        `users/${user?.id}/friendRequests/sent/${receiverId}`
      );
      const receiverRef = ref(
        database,
        `users/${receiverId}/friendRequests/received/${user?.id}`
      );

      await set(userRef, { name: user?.fullName });
      await set(receiverRef, { name: user?.fullName });

      setNewFriendEmail(""); // Clear input
    } else {
      console.error("User not found");
    }
  };

  // Accept a friend request
  const acceptFriendRequest = async (requestingUserId: string) => {
    const friendsRef = ref(
      database,
      `users/${user?.id}/friends/${requestingUserId}`
    );
    const requesterFriendsRef = ref(
      database,
      `users/${requestingUserId}/friends/${user?.id}`
    );

    // Add each other as friends
    await set(friendsRef, true);
    await set(requesterFriendsRef, true);

    // Remove from friend requests
    const requestRef = ref(
      database,
      `users/${user?.id}/friendRequests/received/${requestingUserId}`
    );
    const sentRequestRef = ref(
      database,
      `users/${requestingUserId}/friendRequests/sent/${user?.id}`
    );

    await remove(requestRef);
    await remove(sentRequestRef);
  };

  // Reject a friend request
  const rejectFriendRequest = async (requestingUserId: string) => {
    const requestRef = ref(
      database,
      `users/${user?.id}/friendRequests/received/${requestingUserId}`
    );
    const sentRequestRef = ref(
      database,
      `users/${requestingUserId}/friendRequests/sent/${user?.id}`
    );

    await remove(requestRef);
    await remove(sentRequestRef);
  };

  return (
    <div className="flex h-screen bg-gray-100 flex-col sm:flex-row">
      <aside className="sm:w-[25%] bg-white border-r">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Chat App</h1>
          <UserButton />
        </div>
        <div className="p-4">
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="sm:h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-4">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center space-x-4 cursor-pointer hover:bg-gray-100 p-2 rounded-lg"
                onClick={() => goToChat(friend.id)}
              >
                <Avatar>
                  <AvatarImage src={friend.photoUrl} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {friend.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {friend.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
      <main className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Chat App</CardTitle>
            <CardDescription>
              Connect with friends and start chatting!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="add-friend">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add-friend">Add Friend</TabsTrigger>
                <TabsTrigger value="requests">Friend Requests</TabsTrigger>
              </TabsList>
              <TabsContent value="add-friend" className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="Enter friend's email"
                    value={newFriendEmail}
                    onChange={(e) => setNewFriendEmail(e.target.value)}
                  />
                  <Button onClick={sendFriendRequest}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="requests" className="space-y-4">
                {friendRequests.map((request) => (
                  <div
                    key={request.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      {/* <Avatar>
                        <AvatarImage src={request.userId} alt={request.name} />
                        <AvatarFallback>
                          {request.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar> */}
                      <span>{request.name}</span>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => acceptFriendRequest(request.userId)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rejectFriendRequest(request.userId)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
