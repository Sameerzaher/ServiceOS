"use client";

import { heUi } from "@/config";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface DemoExportBarProps {
  onLoadDemo: () => void;
  onReset: () => void;
  onExportStudents: () => void;
  onExportLessons: () => void;
  className?: string;
}

export function DemoExportBar({
  onLoadDemo,
  onReset,
  onExportStudents,
  onExportLessons,
  className,
}: DemoExportBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
        className,
      )}
    >
      <Button type="button" variant="primary" onClick={onLoadDemo}>
        {heUi.demo.load}
      </Button>
      <Button type="button" variant="danger" onClick={onReset}>
        {heUi.demo.reset}
      </Button>
      <span className="hidden h-8 w-px bg-neutral-200 sm:block" aria-hidden />
      <Button type="button" variant="secondary" onClick={onExportStudents}>
        {heUi.export.students}
      </Button>
      <Button type="button" variant="secondary" onClick={onExportLessons}>
        {heUi.export.lessons}
      </Button>
    </div>
  );
}
