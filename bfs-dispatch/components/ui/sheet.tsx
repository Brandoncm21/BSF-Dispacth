"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-lg">
        {children}
      </div>
    </div>
  );
};

interface SheetContentProps {
  children?: React.ReactNode;
  className?: string;
}

const SheetContent = ({ children, className }: SheetContentProps) => {
  return (
    <div className={cn("h-full flex flex-col p-6", className)}>
      {children}
    </div>
  );
};

interface SheetHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

const SheetHeader = ({ children, className }: SheetHeaderProps) => {
  return (
    <div className={cn("mb-6", className)}>
      {children}
    </div>
  );
};

interface SheetTitleProps {
  children?: React.ReactNode;
  className?: string;
}

const SheetTitle = ({ children, className }: SheetTitleProps) => {
  return (
    <h2 className={cn("text-lg font-semibold text-zinc-900 dark:text-zinc-50", className)}>
      {children}
    </h2>
  );
};

interface SheetDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

const SheetDescription = ({ children, className }: SheetDescriptionProps) => {
  return (
    <p className={cn("text-sm text-zinc-500 dark:text-zinc-400 mt-1", className)}>
      {children}
    </p>
  );
};

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription };
export type { SheetProps };