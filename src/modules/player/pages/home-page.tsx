"use client";

import { Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerNameField } from "@/modules/player/components/player-name-field";
import { CreateRoomForm } from "@/modules/player/components/create-room-form";
import { OpenRoomsList } from "@/modules/player/components/open-rooms-list";

export function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Palette className="size-5" />
          </div>
          <CardTitle>Pictionary</CardTitle>
          <CardDescription>Pick a name, then create a room or join one already open.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerNameField />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create room</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateRoomForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rooms</CardTitle>
          <CardDescription>Open rooms you can join right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <OpenRoomsList />
        </CardContent>
      </Card>
    </div>
  );
}
