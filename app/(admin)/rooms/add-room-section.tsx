"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateRoomForm } from "./create-room-form";

export function AddRoomSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        Thêm phòng
      </Button>
    );
  }

  return <CreateRoomForm onDone={() => setOpen(false)} />;
}
