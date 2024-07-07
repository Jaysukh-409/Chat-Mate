import AddFriendButton from "@/components/AddFriendButton";
import { FC } from "react";

const Page: FC = () => {
  return (
    <main className="pt-8">
      <h1 className="font-bold">Add a friend</h1>
      <AddFriendButton />
    </main>
  );
};

export default Page;
