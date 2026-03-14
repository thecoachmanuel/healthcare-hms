"use client";
export default function PrintActions() {
  return (
    <div className="flex gap-2">
      <button onClick={() => window.print()} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm">
        Print / Save PDF
      </button>
    </div>
  );
}

