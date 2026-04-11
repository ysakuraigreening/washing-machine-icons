"use client";

import useSWR from "swr";
import Image from "next/image";
import { LaundryCard } from "./laundry-card";
import type { LaundryStatus } from "@/types/laundry";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LaundryGrid() {
  const { data, error, isLoading } = useSWR<LaundryStatus>(
    "/api/laundry",
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Now Loading...</p>
        <Image
          src="/images/loading-spinner.gif"
          alt="Loading"
          width={48}
          height={48}
          unoptimized
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Loading error</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try again later
        </p>
      </div>
    );
  }

  if (!data?.machines.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No machines registered</p>
      </div>
    );
  }

  // マシンを取得
  const unit001 = data.machines.find((m) => m.id === "unit-001");
  const unit002 = data.machines.find((m) => m.id === "unit-002");
  const unit003 = data.machines.find((m) => m.id === "unit-003");
  const unit004 = data.machines.find((m) => m.id === "unit-004");
  const unit005 = data.machines.find((m) => m.id === "unit-005");

  return (
    <div className="flex gap-12">
      {/* Left column: UNIT_003, UNIT_004, UNIT_005 */}
      <div className="flex flex-col gap-12">
        {unit003 && <LaundryCard machine={unit003} />}
        {unit004 && <LaundryCard machine={unit004} />}
        {unit005 && <LaundryCard machine={unit005} />}
      </div>

      {/* Center column: UNIT_002 */}
      <div>
        {unit002 && <LaundryCard machine={unit002} />}
      </div>

      {/* Right column: UNIT_001 */}
      <div>
        {unit001 && <LaundryCard machine={unit001} />}
      </div>
    </div>
  );
}
