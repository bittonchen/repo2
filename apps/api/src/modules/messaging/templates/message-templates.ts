interface TemplateResult {
  subject?: string;
  body: string;
}

interface AppointmentReminderParams {
  clientName: string;
  animalName: string;
  date: string;
  time: string;
}

interface VaccinationReminderParams {
  clientName: string;
  animalName: string;
  vaccineName: string;
  dueDate: string;
}

interface FollowUpReminderParams {
  clientName: string;
  animalName: string;
  reason: string;
  date: string;
}

interface CustomParams {
  body: string;
  subject?: string;
}

export const messageTemplates = {
  appointment_reminder: (params: AppointmentReminderParams): TemplateResult => ({
    subject: `תזכורת לתור - ${params.animalName}`,
    body: `שלום ${params.clientName}, תזכורת לתור של ${params.animalName} בתאריך ${params.date} בשעה ${params.time}. נשמח לראותכם! - VetFlow`,
  }),

  vaccination_reminder: (params: VaccinationReminderParams): TemplateResult => ({
    subject: `תזכורת חיסון - ${params.animalName}`,
    body: `שלום ${params.clientName}, תזכורת: ${params.animalName} צריך/ה לקבל חיסון ${params.vaccineName} עד תאריך ${params.dueDate}. אנא צרו קשר לקביעת תור. - VetFlow`,
  }),

  follow_up_reminder: (params: FollowUpReminderParams): TemplateResult => ({
    subject: `תזכורת מעקב - ${params.animalName}`,
    body: `שלום ${params.clientName}, תזכורת למעקב עבור ${params.animalName} בנושא: ${params.reason}. מועד מומלץ: ${params.date}. אנא צרו קשר לקביעת תור. - VetFlow`,
  }),

  custom: (params: CustomParams): TemplateResult => ({
    subject: params.subject,
    body: params.body,
  }),
} as const;

export type TemplateName = keyof typeof messageTemplates;
