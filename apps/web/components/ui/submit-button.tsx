"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

export interface SubmitButtonProps extends Omit<ButtonProps, "type" | "asChild"> {
  pendingLabel?: string;
}

export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
