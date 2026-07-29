export interface ContactSubmissionInput {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  createdAt: string;
}

export interface AdminContactSubmission extends ContactSubmission {
  isRead: boolean;
  adminNotes: string | null;
}

export type AcademyExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AcademyRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  country?: string | null;
  experienceLevel?: AcademyExperienceLevel | null;
  motivation?: string | null;
}

export interface AcademyRegistration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string | null;
  experienceLevel: AcademyExperienceLevel | null;
  motivation: string | null;
  status: 'pending';
  createdAt: string;
}

export type AcademyRegistrationStatus = 'pending' | 'contacted' | 'enrolled' | 'rejected';

export interface AdminAcademyRegistration extends Omit<AcademyRegistration, 'status'> {
  status: AcademyRegistrationStatus;
  adminNotes: string | null;
  isRead: boolean;
  updatedAt: string;
}
