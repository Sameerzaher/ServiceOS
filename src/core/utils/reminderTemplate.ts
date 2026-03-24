/** Replaces {{name}} and {{time}} in reminder copy. */
export function applyReminderTemplate(
  template: string,
  name: string,
  timeShort: string,
): string {
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, name)
    .replace(/\{\{\s*time\s*\}\}/gi, timeShort);
}
