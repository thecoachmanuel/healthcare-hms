"use client";

import { downloadCSV } from "@/lib/csv-export";
import { format } from "date-fns";

export function ExportCsvButton({
  data,
  filenamePrefix,
  className,
}: {
  data: Array<Record<string, any>>;
  filenamePrefix: string;
  className?: string;
}) {
  return (
    <button
      onClick={() => {
        const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
        downloadCSV(data as any, `${filenamePrefix}_${timestamp}.csv`);
      }}
      className={className}
    >
      Export CSV
    </button>
  );
}

