"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { AmountKeypad } from "@/components/ui/amount-keypad";
import { Input } from "@/components/ui/input";

type AmountInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  keypad?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function formatAmountDigits(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export function AmountInput({
  defaultValue,
  keypad = false,
  className,
  value: controlledValue,
  onValueChange,
  ...props
}: AmountInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    typeof defaultValue === "string" || typeof defaultValue === "number"
      ? formatAmountDigits(String(defaultValue))
      : ""
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  function setValue(next: string) {
    const formatted = formatAmountDigits(next);

    if (!isControlled) {
      setUncontrolledValue(formatted);
    }

    onValueChange?.(formatted);
  }

  return (
    <div className="grid gap-3">
      <Input
        {...props}
        type="text"
        inputMode={keypad ? "none" : "numeric"}
        readOnly={keypad}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={className}
      />
      {keypad ? (
        <AmountKeypad
          onDigit={(digit) => setValue(`${value.replace(/[^\d]/g, "")}${digit}`)}
          onBackspace={() => setValue(value.replace(/[^\d]/g, "").slice(0, -1))}
        />
      ) : null}
    </div>
  );
}
