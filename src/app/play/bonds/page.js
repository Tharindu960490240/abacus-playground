"use client";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import TimedDrill from "@/components/game/TimedDrill";

export default function Page() {
  return (
    <RequireAuth>
      <PageHeader title="Number bonds" subtitle="Find the missing number as fast as you can." />
      <TimedDrill kind="bonds" />
    </RequireAuth>
  );
}
