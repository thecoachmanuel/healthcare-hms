"use client";

import React, { useMemo, useState } from "react";
import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input as TextInput } from "./ui/input";
import { ProfileImage } from "./profile-image";

interface InputProps {
  type: "input" | "select" | "checkbox" | "switch" | "radio" | "textarea";
  control: Control<any>;
  name: string;
  label?: string;
  placeholder?: string;
  inputType?: "text" | "email" | "password" | "date" | "tel";
  selectList?: Array<{ label: string; value: string; img?: string; hospital_number?: string; colorCode?: string }>;
  defaultValue?: string;
  readOnly?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}

const RenderInput = ({ field, props }: { field: any; props: InputProps }) => {
  const isSelect = props.type === "select";
  const [query, setQuery] = useState("");
  const enableSearch = props.searchable !== false;
  const options = props.selectList ?? [];
  const filtered = useMemo(() => {
    if (!isSelect) return options;
    if (!enableSearch || query.trim().length === 0) return options.filter((o) => o.value !== "");
    const q = query.toLowerCase();
    return options.filter((o) => {
      const labelHit = (o.label || "").toLowerCase().includes(q);
      const hn = (o as any).hospital_number || "";
      const hnHit = String(hn).toLowerCase().includes(q);
      return o.value !== "" && (labelHit || hnHit);
    });
  }, [options, query, enableSearch, isSelect]);

  switch (props.type) {
    case "input":
      const isPhoneField =
        props.name === "phone" ||
        props.name.endsWith("phone") ||
        props.name.includes("contact_number") ||
        props.name.includes("emergency_contact_number");
      return (
        <FormControl>
          <Input
            type={isPhoneField ? "tel" : props.inputType}
            placeholder={props.placeholder}
            inputMode={isPhoneField ? "numeric" : undefined}
            pattern={isPhoneField ? "[0-9]*" : undefined}
            maxLength={isPhoneField ? 12 : undefined}
            readOnly={props.readOnly}
            disabled={props.disabled}
            {...field}
          />
        </FormControl>
      );

    case "select": {
      return (
        <Select onValueChange={field.onChange} value={field?.value}>
          <FormControl>
            <SelectTrigger disabled={props.disabled}>
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {enableSearch ? (
              <div className="p-2">
                <TextInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="h-8"
                />
              </div>
            ) : null}
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((i, id) => (
                <SelectItem key={id} value={i.value} className="py-2">
                  {(i.img || i.hospital_number) ? (
                    <div className="flex items-center gap-2">
                      <ProfileImage url={(i as any).img} name={i.label} bgColor={(i as any).colorCode} textClassName="text-black" />
                      <div className="flex flex-col">
                        <span className="text-sm">{i.label}</span>
                        {i.hospital_number ? (
                          <span className="text-xs text-gray-500">HN: {i.hospital_number}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    i.label
                  )}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      );
    }

    case "checkbox":
      return (
        <div className="items-top flex space-x-2">
          <Checkbox
            id={props.name}
            checked={field.value ?? false}
            onCheckedChange={(e) => field.onChange(e === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={props.name}
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {props.label}
            </label>
            <p className="text-sm text-muted-foreground">{props.placeholder}</p>
          </div>
        </div>
      );

    case "radio":
      return (
        <div className="w-full">
          <FormLabel>{props.label}</FormLabel>
          <RadioGroup
            defaultValue={props.defaultValue}
            onChange={field.onChange}
            className="flex gap-4"
          >
            {props?.selectList?.map((i, id) => (
              <div className="flex items-center w-full" key={id}>
                <RadioGroupItem
                  value={i.value}
                  id={i.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={i.value}
                  className="flex flex-1 items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:text-blue-600"
                >
                  {i.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case "textarea":
      return (
        <FormControl>
          <Textarea
            type={props.inputType}
            placeholder={props.placeholder}
            {...field}
          ></Textarea>
        </FormControl>
      );
  }
};
export const CustomInput = (props: InputProps) => {
  const { name, label, control, type } = props;

  return (
    // <div className="w-full pt-6">
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          {type !== "radio" && type !== "checkbox" && (
            <FormLabel>{label}</FormLabel>
          )}
          <RenderInput field={field} props={props} />
          <FormMessage />
        </FormItem>
      )}
    />
    // </div>
  );
};

type Day = {
  day: string;
  start_time?: string;
  close_time?: string;
};
interface SwitchProps {
  data: { label: string; value: string }[];
  setWorkSchedule: React.Dispatch<React.SetStateAction<Day[]>>;
  schedule?: Day[];
}

export const SwitchInput = ({ data, setWorkSchedule, schedule }: SwitchProps) => {
  const handleChange = (day: string, field: any, value: string) => {
    setWorkSchedule((prevDays) => {
      const dayExist = prevDays.find((d) => d.day === day);

      if (dayExist) {
        return prevDays.map((d) =>
          d.day === day ? { ...d, [field]: value } : d
        );
      } else {
        if (field === true) {
          return [
            ...prevDays,
            { day, start_time: "09:00", close_time: "17:00" },
          ];
        } else {
          return [...prevDays, { day, [field]: value }];
        }
      }
    });
  };

  return (
    <div className="">
      {data?.map((el, id) => (
        <div
          key={id}
          className="w-full  flex items-center space-y-3 border-t border-t-gray-200  py-3"
        >
          <Switch
            id={el.value}
            className="data-[state=checked]:bg-blue-600 peer"
            defaultChecked={Boolean(schedule?.find((d) => d.day === el.value))}
            onCheckedChange={() => handleChange(el.value, true, "09:00")}
          />
          <Label htmlFor={el.value} className="w-20 capitalize">
            {el.value}
          </Label>

          <Label className="text-gray-400 font-normal italic peer-data-[state=checked]:hidden pl-10">
            Not working on this day
          </Label>

          <div className="hidden peer-data-[state=checked]:flex items-center gap-2 pl-6:">
            <Input
              name={`${el.label}.start_time`}
              type="time"
              defaultValue={schedule?.find((d) => d.day === el.value)?.start_time ?? "09:00"}
              onChange={(e) =>
                handleChange(el.value, "start_time", e.target.value)
              }
            />
            <Input
              name={`${el.label}.close_time`}
              type="time"
              defaultValue={schedule?.find((d) => d.day === el.value)?.close_time ?? "17:00"}
              onChange={(e) =>
                handleChange(el.value, "close_time", e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
};
