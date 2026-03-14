"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDoctorDaySlots } from "@/app/actions/appointment";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DoctorAvailabilityCalendar({
  doctors,
  initialDate,
}: {
  doctors: { id: string; name: string }[];
  initialDate?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [doctorId, setDoctorId] = useState(doctorIdFrom(doctors));
  const [date, setDate] = useState(initialDate ?? today());
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<{ all: string[]; booked: string[] }>({ all: [], booked: [] });
  const [view, setView] = useState<"day" | "week">("day");
  const [weekData, setWeekData] = useState<Record<string, { all: string[]; booked: string[] }>>({});

  const doctorName = useMemo(() => doctors.find((d) => d.id === doctorId)?.name ?? "", [doctorId, doctors]);

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
      if (!doctorId || !date) return;
      setLoading(true);
      try {
        if (view === "day") {
          const s = await getDoctorDaySlots(doctorId, date);
          setSlots(s ?? { all: [], booked: [] });
        } else {
          const days = next7Days(date);
          const results = await Promise.all(days.map((d) => getDoctorDaySlots(doctorId, d)));
          const mapped: Record<string, { all: string[]; booked: string[] }> = {};
          days.forEach((d, i) => (mapped[d] = results[i] ?? { all: [], booked: [] }));
          setWeekData(mapped);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId, date, view]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Doctor Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <select
            className="border rounded-md px-3 py-2 text-sm w-full md:w-72"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border rounded-md px-3 py-2 text-sm w-full md:w-48"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={() => setDate(today())}>Today</Button>
          <div className="flex gap-2">
            <Button size="sm" variant={view === "day" ? "default" : "outline"} onClick={() => handleViewChange("day")}>
              Day
            </Button>
            <Button size="sm" variant={view === "week" ? "default" : "outline"} onClick={() => handleViewChange("week")}>
              Week
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-2">{doctorName ? `Availability for ${doctorName}` : "Select a doctor"}</div>

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
          slots.all.length === 0 ? (
            <div className="text-sm text-gray-500">No available slots</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {slots.all.map((t) => {
                const isBooked = slots.booked.includes(t);
                return (
                  <span
                    key={t}
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
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {next7Days(date).map((d) => {
              const data = weekData[d] ?? { all: [], booked: [] };
              return (
                <div key={d} className="border rounded-md p-3">
                  <div className="text-xs font-medium mb-2">{formatLabel(d)}</div>
                  {data.all.length === 0 ? (
                    <div className="text-xs text-gray-500">No working hours</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {data.all.map((t) => {
                        const isBooked = data.booked.includes(t);
                        return (
                          <span
                            key={`${d}-${t}`}
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
              );
            })}
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

function doctorIdFrom(doctors: { id: string }[]) {
  return doctors?.[0]?.id ?? "";
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
