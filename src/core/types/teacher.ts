/** Stable identifier for a teacher profile. */
export type TeacherId = string;

/**
 * Teacher (instructor) profile — public-facing fields for landing / booking by slug.
 */
export interface Teacher {
  id: TeacherId;
  fullName: string;
  businessName: string;
  phone: string;
  /** URL-safe handle; must be unique in storage (see DB constraint). */
  slug: string;
  createdAt: string;
}
