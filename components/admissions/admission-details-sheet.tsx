"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import React from "react";

export interface AdmissionDetails {
  id: number;
  status: string;
  wardName?: string | null;
  attendingName?: string | null;
  admitted_at?: string | Date | null;
  discharged_at?: string | Date | null;
  discharge_notes?: string | null;
  discharged_by_name?: string | null;
}

export interface AuditEntry {
  id: number;
  action: string;
  details?: string | null;
  created_at: string | Date;
}

export function AdmissionDetailsSheet({ admission, logs }: { admission: AdmissionDetails; logs: AuditEntry[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">View</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg" side="right">
        <SheetHeader>
          <SheetTitle>Admission Details</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Ward</div>
              <div className="font-medium">{admission.wardName ?? "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Attending</div>
              <div className="font-medium">{admission.attendingName ?? "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div className="font-medium">{admission.status}</div>
            </div>
            <div>
              <div className="text-gray-500">Admitted</div>
              <div className="font-medium">{admission.admitted_at ? format(new Date(admission.admitted_at), "yyyy-MM-dd HH:mm") : "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Discharged</div>
              <div className="font-medium">{admission.discharged_at ? format(new Date(admission.discharged_at), "yyyy-MM-dd HH:mm") : "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Discharged By</div>
              <div className="font-medium">{admission.discharged_by_name ?? "—"}</div>
            </div>
          </div>

          {admission.discharge_notes && (
            <div>
              <div className="text-gray-500 text-sm">Discharge Notes</div>
              <pre className="whitespace-pre-wrap text-sm border rounded-md p-3">{admission.discharge_notes}</pre>
            </div>
          )}

          <div>
            <div className="text-gray-500 text-sm">Audit Trail</div>
            {logs.length === 0 ? (
              <div className="text-xs text-gray-400 mt-1">No audit entries.</div>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {logs.map((l) => (
                  <li key={l.id} className="border rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{l.action}</span>
                      <span className="text-xs text-gray-500">{format(new Date(l.created_at), "yyyy-MM-dd HH:mm")}</span>
                    </div>
                    {l.details && <div className="text-xs text-gray-600 mt-1">{l.details}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

