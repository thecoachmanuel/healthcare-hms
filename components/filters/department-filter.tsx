"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useState } from "react";

export function DepartmentFilter({
  param = "department",
  label = "Department",
  placeholder = "e.g. Pharmacy",
}: {
  param?: string;
  label?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(param) ?? "");

  const createQueryString = useCallback(
    (name: string, v: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (v.trim().length === 0) params.delete(name);
      else params.set(name, v);
      params.delete("p");
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="hidden xl:flex items-center gap-2 border border-gray-300 px-2 py-2 rounded-md focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300">
      <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>
      <input
        className="outline-none px-2 text-sm w-36"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            router.push(pathname + "?" + createQueryString(param, value));
          }
        }}
      />
    </div>
  );
}

