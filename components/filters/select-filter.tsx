"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

export function SelectFilter({
  param,
  label,
  options,
}: {
  param: string;
  label: string;
  options: { label: string; value: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo(() => searchParams.get(param) ?? "", [searchParams, param]);

  return (
    <div className="hidden xl:flex items-center gap-2 border border-gray-300 px-2 py-2 rounded-md">
      <span className="text-sm text-gray-500">{label}</span>
      <select
        className="bg-transparent outline-none text-sm"
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          const v = e.target.value;
          if (!v) {
            params.delete(param);
          } else {
            params.set(param, v);
          }
          params.delete("p");
          router.push(pathname + "?" + params.toString());
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

