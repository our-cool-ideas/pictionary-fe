"use client";

import { useRouter } from "next/navigation";
import { DoorClosed, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoomNoticeScreenProps {
  variant: "kicked" | "closed";
}

const COPY = {
  kicked: {
    icon: UserX,
    title: "You were removed from the room",
    description: "The host kicked you from this room.",
  },
  closed: {
    icon: DoorClosed,
    title: "This room has closed",
    description: "The room sat empty (or with just one player) for too long and was automatically closed.",
  },
} as const;

export function RoomNoticeScreen({ variant }: RoomNoticeScreenProps) {
  const router = useRouter();
  const { icon: Icon, title, description } = COPY[variant];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Icon className="mb-2 size-10 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
