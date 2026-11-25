"use client";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import TimedDrill from "@/components/game/TimedDrill";

export default function Page() {
  return (
    <RequireAuth>
      <PageHeader title="Times tables" subtitle="How many can you answer before the time runs out?" />
      <TimedDrill kind="tables" />
    </RequireAuth>
  );
}
