import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TONE_TO_VARIANT = {
  primary: "default",
  ghost: "outline",
  light: "secondary",
};

const AppButton = forwardRef(function AppButton(
  { tone = "primary", className, asChild = false, size = "default", ...props },
  ref
) {
  const variant = TONE_TO_VARIANT[tone] || "default";
  return (
    <Button
      ref={ref}
      asChild={asChild}
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    />
  );
});

export default AppButton;
