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
        <p className="text-red-500">読み込みエラーが発生しました</p>
        <p className="text-sm text-muted-foreground mt-2">
          しばらくしてから再度お試しください
        </p>
      </div>
    );
  }

  if (!data?.machines.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">登録されている洗濯機がありません</p>
      </div>
    );
  }

  // Split machines: first 2 for top row, rest for bottom column
  const topRow = data.machines.slice(0, 2);
  const bottomColumn = data.machines.slice(2);

  return (
    <div className="flex flex-col gap-4">
      {/* Top row - 2 cards */}
      <div className="flex gap-4">
        {topRow.map((machine) => (
          <LaundryCard key={machine.id} machine={machine} />
        ))}
      </div>
      
      {/* Bottom column - remaining cards stacked */}
      <div className="flex flex-col gap-4">
        {bottomColumn.map((machine) => (
          <LaundryCard key={machine.id} machine={machine} />
        ))}
      </div>
    </div>
  );
}
