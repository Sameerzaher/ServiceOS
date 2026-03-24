export interface ReminderTemplateVars {
  name: string;
  time: string;
  businessName?: string;
  businessPhone?: string;
}

/**
 * Replaces placeholders in reminder copy:
 * `{{name}}`, `{{time}}`, `{{business}}` / `{{businessName}}`, `{{businessPhone}}`.
 */
export function applyReminderTemplate(
  template: string,
  vars: ReminderTemplateVars,
): string {
  const biz = vars.businessName ?? "";
  const phone = vars.businessPhone ?? "";
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, vars.name)
    .replace(/\{\{\s*time\s*\}\}/gi, vars.time)
    .replace(/\{\{\s*business(Name)?\s*\}\}/gi, biz)
    .replace(/\{\{\s*businessPhone\s*\}\}/gi, phone);
}
