import db from "@/lib/db";
import { getPatientPosition } from "@/app/actions/queue";

type Props = { params: Promise<{ visitId: string }> };

export default async function PatientQueuePage({ params }: Props) {
  const { visitId } = await params;
  const ticket = await db.queueTicket.findUnique({ where: { visit_id: Number(visitId) } });
  const pos = await getPatientPosition(Number(visitId));
  const position = pos.position ?? null;
  return (
    <div className="p-6 space-y-4">
      <div className="text-2xl font-bold">Queue Tracking</div>
      {!ticket && <div className="text-sm text-gray-600">No ticket found</div>}
      {ticket && (
        <div className="space-y-2">
          <div className="text-sm">Queue Number: <span className="font-mono">{ticket.queue_number}</span></div>
          <div className="text-sm">Priority: {ticket.priority}</div>
          <div className="text-sm">Status: {ticket.status}</div>
          {position !== null && ticket.status === "WAITING" && (
            <div className="text-sm">Position in Queue: {position}</div>
          )}
        </div>
      )}
    </div>
  );
}

