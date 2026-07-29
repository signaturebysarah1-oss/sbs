import {
  createAcademyRegistration,
  findAllAcademyRegistrations,
  findAcademyRegistrationById,
} from '../repositories/academy.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  AcademyRegistration,
  AcademyRegistrationInput,
  AdminAcademyRegistration,
} from '../types/form.types.js';

export async function registerForAcademy(
  input: AcademyRegistrationInput,
): Promise<AcademyRegistration> {
  return createAcademyRegistration(input);
}

export async function getAllAcademyRegistrations(): Promise<AdminAcademyRegistration[]> {
  return findAllAcademyRegistrations();
}

export async function getAcademyRegistrationById(id: string): Promise<AdminAcademyRegistration> {
  const registration = await findAcademyRegistrationById(id);
  if (!registration) throw AppError.notFound('Academy application not found');
  return registration;
}
