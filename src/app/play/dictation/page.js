"use client";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import FlashGame from "@/components/game/FlashGame";

export default function Page() {
  return (
    <RequireAuth>
      <PageHeader title="Dictation" subtitle="Numbers are read aloud. Turn your sound on." />
      <FlashGame kind="dictation" />
    </RequireAuth>
  );
}
