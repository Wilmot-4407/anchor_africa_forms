export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'yes_no'
  | 'rating'
  | 'file'
  | 'heading';

export interface FormField {
  id: string;
  type: FieldType;
  question: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  placeholder?: string;
}

export interface FormSettings {
  allowMultipleSubmissions: boolean;
  endDate?: string | null;
}

export interface PublicForm {
  id: string;
  title: string;
  slug: string;
  category: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
}

export type AnswerValue = string | string[] | File | null;
