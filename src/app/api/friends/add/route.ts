import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    const idToAdd = (await fetchRedis("get", `user:email:${emailToAdd}`)) as
      | string
      | null;

    if (!idToAdd) {
      return new Response("User doesn't exist on this platform.", {
        status: 400,
      });
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (idToAdd === session.user.id) {
      return new Response("Aren't you your friend already ? :)", {
        status: 400,
      });
    }

    // Check if the user is added already
    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    )) as 0 | 1;

    if (isAlreadyAdded) {
      return new Response("This user is already added", { status: 400 });
    }

    // Check if the user is friend already
    const isAlreadyFriend = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:friends`,
      session.user.id
    )) as 0 | 1;

    if (isAlreadyFriend) {
      return new Response("This user is already your friend", { status: 400 });
    }

    // Now add friend request is Valid
    db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

    return new Response("Friend request sent successfully", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }
    return new Response("Invalid request", { status: 400 });
  }
}
