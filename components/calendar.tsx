

"use client";

import * as React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onDateSelect,
  ...props
}: DayPickerProps & { onDateSelect?: (date: string) => void }) {
  const handleDayClick = (date: Date) => {
    const isoDate = date.toISOString().split("T")[0];
    if (onDateSelect) {
      onDateSelect(isoDate);
    }
  };

  return (
    <div className={cn("max-w-md mx-auto", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        onDayClick={handleDayClick}
        className={cn("bg-white rounded-md shadow-md p-4", className)}
        classNames={{
          months: "flex flex-col sm:flex-row gap-4",
          month: "flex flex-col gap-4",
          caption: "flex justify-center items-center relative text-lg font-semibold pb-2",
          nav: "flex justify-between items-center mb-2",
          nav_button: "p-1 opacity-70 hover:opacity-100",
          table: "w-full border-collapse border border-gray-200 rounded-md",
          head_row: "flex",
          head_cell: "flex-1 text-center py-2 font-semibold text-gray-500 text-sm",
          row: "flex w-full",
          cell: "flex-1 aspect-square text-center py-1 cursor-pointer select-none rounded-md transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary",
          day_selected: "bg-primary text-primary-foreground font-semibold",
          day_today: "border border-primary text-primary font-semibold",
          day_outside: "text-gray-400",
          day_disabled: "text-gray-300 cursor-not-allowed",
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}
