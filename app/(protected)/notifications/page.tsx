import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import db from "@/lib/db";
import { format } from "date-fns";
import React from "react";

const NotificationsPage = async () => {
  const userId = await requireAuthUserId();
  await (db as any).notification.updateMany({
    where: { user_id: userId, read: false },
    data: { read: true },
  });
  const notifications: any[] = await (db as any).notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>All your recent activity and updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications yet.</p>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{n.title}</h3>
                  <span className="text-xs text-gray-500">{format(n.created_at, "yyyy-MM-dd HH:mm")}</span>
                </div>
                <p className="text-sm text-gray-600">{n.body}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
