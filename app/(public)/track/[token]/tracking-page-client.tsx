"use client";

import dynamic from "next/dynamic";

const TrackingMapWithNoSSR = dynamic(
  () => import("@/components/tracking-map").then((mod) => ({ default: mod.TrackingMap })),
  { ssr: false }
);

type Props = {
  checkpoints: Record<string, unknown>[];
  loadId: number;
};

export function TrackingPageClient({ checkpoints }: Props) {
  const parsedCheckpoints = (checkpoints || []).map((cp) => ({
    checkpoint_id: cp.checkpoint_id as number,
    lat: Number(cp.lat),
    lng: Number(cp.lng),
    status_at_checkpoint: cp.status_at_checkpoint as string | null,
    recorded_at: cp.recorded_at as string,
    notes: cp.notes as string | null,
  }));

  return (
    <TrackingMapWithNoSSR
      checkpoints={parsedCheckpoints}
      height="250px"
      showPopup={true}
    />
  );
}
