"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface LabVolumeChartProps {
  data: { unit: string; count: number }[];
}

interface ReceivablesChartProps {
  data: { date: string; total: number; paid: number; outstanding: number }[];
}

interface PaymentStatusChartProps {
  data: { status: string; count: number; amount: number }[];
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export function LabVolumeByUnitChart({ data }: LabVolumeChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Lab Test Volume by Unit</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="unit" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Test Count">
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReceivablesOverTimeChart({ data }: ReceivablesChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Receivables Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#2563eb" name="Total Amount" strokeWidth={2} />
          <Line type="monotone" dataKey="paid" stroke="#10b981" name="Amount Paid" strokeWidth={2} />
          <Line type="monotone" dataKey="outstanding" stroke="#ef4444" name="Outstanding" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentStatusDistributionChart({ data }: PaymentStatusChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Payment Status Distribution</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium mb-2">By Count</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">By Amount</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={item.status} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">
                {item.status}: {item.count} (₦{item.amount.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LabTestStatusChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Lab Test Status Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Test Count">
            {data.map((d, index) => {
              const c =
                d.status === "REQUESTED"
                  ? "#f59e0b"
                  : d.status === "SAMPLE_COLLECTED"
                  ? "#f97316"
                  : d.status === "RECEIVED"
                  ? "#d97706"
                  : d.status === "IN_PROGRESS"
                  ? "#2563eb"
                  : d.status === "COMPLETED"
                  ? "#10b981"
                  : d.status === "APPROVED"
                  ? "#059669"
                  : d.status === "CANCELLED"
                  ? "#ef4444"
                  : COLORS[index % COLORS.length];
              return <Cell key={`cell-${index}`} fill={c} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
