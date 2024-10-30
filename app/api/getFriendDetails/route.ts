import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// API route to fetch user details by ID
export async function POST(req: Request) {
  try {
    const { friendIds } = await req.json();

    // Fetch details for each friendId from Clerk
    const friendDetails = await Promise.all(
      friendIds.map(async (friendId: string) => {
        const user = await clerkClient.users.getUser(friendId);
        return {
          id: user.id,
          name: user.fullName,
          email: user.emailAddresses[0].emailAddress,
          photoUrl: user.imageUrl,
        };
      })
    );

    return NextResponse.json({ friends: friendDetails });
  } catch (error) {
    console.error("Error fetching friend details:", error);
    return NextResponse.json({ error: "Error fetching friend details" }, { status: 500 });
  }
}
