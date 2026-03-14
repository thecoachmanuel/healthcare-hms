"use client";

import * as React from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface DateRangeFilterProps {
  className?: string;
}

export function DateRangeFilter({ className }: DateRangeFilterProps) {
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

  // Update URL when dates change
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (fromDate) {
      params.set("from", fromDate);
    } else {
      params.delete("from");
    }
    
    if (toDate) {
      params.set("to", toDate);
    } else {
      params.delete("to");
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
    
    // Trigger a custom event to notify parent components
    window.dispatchEvent(new CustomEvent("dateRangeChanged"));
  }, [fromDate, toDate]);

  const handleQuickSelect = (value: string) => {
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (value) {
      case "today":
        from = today;
        break;
      case "yesterday":
        from = subDays(today, 1);
        to = from;
        break;
      case "thisWeek":
        from = startOfWeek(today);
        break;
      case "lastWeek":
        from = startOfWeek(subDays(today, 7));
        to = endOfWeek(subDays(today, 7));
        break;
      case "thisMonth":
        from = startOfMonth(today);
        break;
      case "lastMonth":
        from = startOfMonth(subMonths(today, 1));
        to = endOfMonth(subMonths(today, 1));
        break;
      default:
        setFromDate("");
        setToDate("");
        return;
    }

    setFromDate(format(from, "yyyy-MM-dd"));
    setToDate(format(to, "yyyy-MM-dd"));
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className || ""}`}>
      <select
        onChange={(e) => handleQuickSelect(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Quick select</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="thisWeek">This Week</option>
        <option value="lastWeek">Last Week</option>
        <option value="thisMonth">This Month</option>
        <option value="lastMonth">Last Month</option>
        <option value="clear">Clear</option>
      </select>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={clearDates}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear
        </button>
      </div>
    </div>
  );
}