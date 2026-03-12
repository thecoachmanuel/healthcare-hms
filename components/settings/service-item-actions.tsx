"use client";

import React from "react";
import { ConfirmDelete } from "@/components/dialogs/confirm-delete";
import { EditServiceItem } from "@/components/dialogs/edit-service-item";
import { deleteServiceCatalogItem } from "@/app/actions/catalog";

export function ServiceItemActions({
  item,
  category,
  labUnits,
}: {
  item: {
    id: number;
    service_name: string;
    price: number;
    description: string;
    lab_unit_id?: number | null;
  };
  category: "GENERAL" | "LAB_TEST" | "MEDICATION";
  labUnits: { label: string; value: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <EditServiceItem
        id={item.id}
        category={category}
        service_name={item.service_name}
        price={item.price}
        description={item.description}
        lab_unit_id={item.lab_unit_id ?? null}
        labUnits={labUnits}
      />
      <ConfirmDelete
        onConfirm={async () => {
          const res = await deleteServiceCatalogItem(item.id);
          return { success: res.success, msg: res.msg };
        }}
      />
    </div>
  );
}

