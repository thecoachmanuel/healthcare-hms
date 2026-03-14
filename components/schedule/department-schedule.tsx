"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDepartmentDaySlots } from "@/app/actions/appointment";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DepartmentSchedule({ initialDepartment, initialDate, options }: { initialDepartment: string; initialDate?: string; options?: { label: string; value: string }[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [department, setDepartment] = useState(initialDepartment);
  const [date, setDate] = useState(initialDate ?? today());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ doctor: { id: string; name: string }; all: string[]; booked: string[] }[]>([]);
  const [view, setView] = useState<"day" | "week">("day");
  const [weekData, setWeekData] = useState<Record<string, { doctor: { id: string; name: string }; all: string[]; booked: string[] }[]>>({});

  const title = useMemo(
    () => (department ? `Schedule for ${department}` : "Department Schedule"),
    [department]
  );

  useEffect(() => {
    const v = searchParams.get("view");
    if (v === "day" || v === "week") {
      setView(v);
    }
  }, [searchParams]);

  const handleViewChange = (next: "day" | "week") => {
    setView(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (view === "day") {
          const s = await getDepartmentDaySlots(department ?? "", date);
          setData(s ?? []);
        } else {
          const days = next7Days(date);
          const results = await Promise.all(days.map((d) => getDepartmentDaySlots(department ?? "", d)));
          const mapped: Record<string, { doctor: { id: string; name: string }; all: string[]; booked: string[] }[]> = {};
          days.forEach((d, i) => (mapped[d] = results[i] ?? []));
          setWeekData(mapped);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [department, date, view]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {options && options.length > 0 ? (
            <select
              className="border rounded-md px-3 py-2 text-sm w-full md:w-72 bg-white"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="border rounded-md px-3 py-2 text-sm w-full md:w-72"
              placeholder="Enter department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          )}
          <input
            type="date"
            className="border rounded-md px-3 py-2 text-sm w-full md:w-48"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={() => setDate(today())}>Today</Button>
          <div className="flex gap-2">
            <Button size="sm" variant={view === "day" ? "default" : "outline"} onClick={() => handleViewChange("day")}>Day</Button>
            <Button size="sm" variant={view === "week" ? "default" : "outline"} onClick={() => handleViewChange("week")}>Week</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-3 text-[11px] sm:text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border border-emerald-300 bg-emerald-50" />
            Free
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full border border-rose-300 bg-rose-50" />
            Booked
          </span>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : view === "day" ? (
          data.length === 0 ? (
            <div className="text-sm text-gray-500">No schedule found</div>
          ) : (
            <div className="space-y-3">
              {data.map(({ doctor, all, booked }) => (
                <div key={doctor.id} className="border rounded-md p-3">
                  <div className="font-medium text-sm mb-2">{doctor.name}</div>
                  {all.length === 0 ? (
                    <div className="text-xs text-gray-500">No working hours on this day</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {all.map((t) => {
                        const isBooked = booked.includes(t);
                        return (
                          <span
                            key={`${doctor.id}-${t}`}
                            className={
                              `inline-block text-xs px-2 py-1 rounded-md border ` +
                              (isBooked
                                ? "bg-rose-50 border-rose-300 text-rose-700"
                                : "bg-emerald-50 border-emerald-300 text-emerald-700")
                            }
                          >
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {next7Days(date).map((d) => (
              <div key={d} className="border rounded-md p-3">
                <div className="text-xs font-medium mb-2">{formatLabel(d)}</div>
                {(weekData[d]?.length ?? 0) === 0 ? (
                  <div className="text-xs text-gray-500">No doctors scheduled</div>
                ) : (
                  <div className="space-y-2">
                    {weekData[d]!.map(({ doctor, all, booked }) => (
                      <div key={`${d}-${doctor.id}`} className="text-xs">
                        <div className="font-medium mb-1">{doctor.name}</div>
                        {all.length === 0 ? (
                          <div className="text-[11px] text-gray-500">No working hours</div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {all.map((t) => {
                              const isBooked = booked.includes(t);
                              return (
                                <span
                                  key={`${d}-${doctor.id}-${t}`}
                                  className={
                                    `inline-block text-[11px] px-2 py-0.5 rounded-md border ` +
                                    (isBooked
                                      ? "bg-rose-50 border-rose-300 text-rose-700"
                                      : "bg-emerald-50 border-emerald-300 text-emerald-700")
                                  }
                                >
                                  {t}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function next7Days(anchor: string) {
  const start = new Date(anchor);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function formatLabel(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
