"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type AmountInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange">;

function formatDigits(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export function AmountInput({ defaultValue, ...props }: AmountInputProps) {
  const [value, setValue] = useState(
    typeof defaultValue === "string" || typeof defaultValue === "number"
      ? formatDigits(String(defaultValue))
      : ""
  );

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(event) => setValue(formatDigits(event.target.value))}
    />
  );
}
