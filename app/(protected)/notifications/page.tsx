import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUserId } from "@/lib/auth";
import React from "react";

const NotificationsPage = async () => {
  await requireAuthUserId();

  return (
    <div className="p-6">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>All your recent activity and updates.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          No notifications yet.
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
