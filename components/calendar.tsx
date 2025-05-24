"use client";

import * as React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  return (
    <div className={cn("max-w-md mx-auto", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("bg-white rounded-md shadow-md p-4", className)}
        classNames={{
          months: "flex flex-col sm:flex-row gap-4",
          month: "flex flex-col gap-4",
          caption:
            "flex justify-center items-center relative text-lg font-semibold pb-2",
          nav: "flex justify-between items-center mb-2",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "p-1 opacity-70 hover:opacity-100 focus:ring-2 focus:ring-primary"
          ),
          table: "w-full border-collapse border border-gray-200 rounded-md",
          head_row: "flex",
          head_cell:
            "flex-1 text-center py-2 font-semibold text-gray-500 text-sm",
          row: "flex w-full",
          cell:
            "flex-1 aspect-square text-center py-1 cursor-pointer select-none rounded-md transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary",
          day_selected: "bg-primary text-primary-foreground font-semibold",
          day_today: "border border-primary text-primary font-semibold",
          day_outside: "text-gray-400",
          day_disabled: "text-gray-300 cursor-not-allowed",
          ...classNames,
        }}
        {...props}
      />
      <div className="flex justify-between mt-2">
        <button
          aria-label="Previous month"
          className="p-1 opacity-70 hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          aria-label="Next month"
          className="p-1 opacity-70 hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
