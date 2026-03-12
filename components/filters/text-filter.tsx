"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";

export function TextFilter({
  param,
  label,
  placeholder,
}: {
  param: string;
  label: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useMemo(() => searchParams.get(param) ?? "", [searchParams, param]);
  const [value, setValue] = useState(initial);

  return (
    <form
      className="hidden xl:flex items-center gap-2 border border-gray-300 px-2 py-2 rounded-md"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (!value) params.delete(param);
        else params.set(param, value);
        params.delete("p");
        router.push(pathname + "?" + params.toString());
      }}
    >
      <span className="text-sm text-gray-500">{label}</span>
      <input
        className="outline-none text-sm bg-transparent w-[140px]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}

