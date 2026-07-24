import type { SchoolType } from '@/types/school'

/**
 * "Course" reads as a tertiary-education term — a primary/secondary
 * teacher building lesson content for "Mathematics" thinks of it as their
 * subject, not a course. College/university keep "Course" (a real,
 * separate concept there — e.g. "Calculus 101" under the Mathematics
 * subject). The underlying Course model/route is unchanged either way;
 * this only swaps the user-facing word.
 */
const SUBJECT_BASED_TYPES: SchoolType[] = ['nursery', 'primary', 'secondary']

export function isSubjectBasedSchool(type: SchoolType | null | undefined): boolean {
  return Boolean(type && SUBJECT_BASED_TYPES.includes(type))
}

export function lmsTerm(type: SchoolType | null | undefined): { singular: string; plural: string; description: string } {
  return isSubjectBasedSchool(type)
    ? { singular: 'Subject', plural: 'Subjects', description: 'Lesson content by subject' }
    : { singular: 'Course', plural: 'Courses', description: 'Lesson content by course' }
}
