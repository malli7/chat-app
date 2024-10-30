import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

// API route to get receiver ID by email
export async function POST(req: Request) {
  try {
    // Parse the request body
    const { email } = await req.json();

    // Fetch the user list from Clerk API using the email address
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });
    if (users) {
      const receiverId = users.data[0].id;
      return NextResponse.json({ receiverId });
    } else {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching receiver ID:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
