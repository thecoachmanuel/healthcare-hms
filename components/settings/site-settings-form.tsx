"use client";

import { setSiteSettings } from "@/app/actions/admin";
import { CustomInput } from "@/components/custom-input";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function SiteSettingsForm({ initial }: { initial: any }) {
  const [loading, setLoading] = useState(false);
  const form = useForm({
    defaultValues: {
      site_name: initial?.site_name ?? "Healthcare HMS",
      logo_url: initial?.logo_url ?? "",
      homepage_text: initial?.homepage_text ?? "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);
      const res = await setSiteSettings(values);
      if (res.success) toast.success(res.msg);
      else toast.error(res.msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="capitalize">Site Settings</CardTitle>
          <CardDescription>Update site name, logo, and homepage text.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CustomInput type="input" control={form.control} name="site_name" label="Site Name" placeholder="" />
          <CustomInput type="input" control={form.control} name="logo_url" label="Logo URL" placeholder="" />
          <CustomInput type="textarea" control={form.control} name="homepage_text" label="Homepage Text" placeholder="" />
          <Button type="submit" disabled={loading} className="bg-blue-600">
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </>
  );
}

