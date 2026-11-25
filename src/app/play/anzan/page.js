"use client";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import FlashGame from "@/components/game/FlashGame";

export default function Page() {
  return (
    <RequireAuth>
      <PageHeader title="Anzan" subtitle="Numbers flash one after another. Add them up in your head." />
      <FlashGame kind="anzan" />
    </RequireAuth>
  );
}
