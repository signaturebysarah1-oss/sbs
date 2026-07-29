import {
  createContactSubmission,
  findAllContactSubmissions,
  findContactSubmissionById,
} from '../repositories/contact.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  AdminContactSubmission,
  ContactSubmission,
  ContactSubmissionInput,
} from '../types/form.types.js';

export async function submitContactForm(input: ContactSubmissionInput): Promise<ContactSubmission> {
  return createContactSubmission(input);
}

export async function getAllContactSubmissions(): Promise<AdminContactSubmission[]> {
  return findAllContactSubmissions();
}

export async function getContactSubmissionById(id: string): Promise<AdminContactSubmission> {
  const submission = await findContactSubmissionById(id);
  if (!submission) throw AppError.notFound('Contact submission not found');
  return submission;
}
