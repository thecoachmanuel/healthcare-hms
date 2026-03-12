"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DoctorSpecializationChart({
  data,
}: {
  data: { specialization: string; count: number }[];
}) {
  return (
    <div className="bg-white p-4 rounded-md h-80">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Doctors by Specialization</h1>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="specialization" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#7c3aed" name="Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

