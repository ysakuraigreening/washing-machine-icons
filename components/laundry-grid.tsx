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
    <div className="flex flex-col gap-8">
      {/* 1行目: 空白 + UNIT_002 + UNIT_001 */}
      <div className="flex gap-8">
        <div className="w-[280px]" /> {/* 空白スペース */}
        {unit002 && <LaundryCard machine={unit002} />}
        {unit001 && <LaundryCard machine={unit001} />}
      </div>

      {/* 2行目: UNIT_003 */}
      {unit003 && <LaundryCard machine={unit003} />}

      {/* 3行目: UNIT_004 */}
      {unit004 && <LaundryCard machine={unit004} />}

      {/* 4行目: UNIT_005 */}
      {unit005 && <LaundryCard machine={unit005} />}
    </div>
  );
}
