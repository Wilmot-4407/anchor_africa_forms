import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import type { PublicForm, FormField, AnswerValue } from '../types';

// ─── Field sub-components ─────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`w-10 h-10 flex items-center justify-center text-3xl leading-none transition-transform hover:scale-110 focus:outline-none ${
            star <= (hovered || value) ? 'text-amber-400' : 'text-gray-200'
          }`}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-400 font-medium">{value} / 5</span>
      )}
    </div>
  );
}

function YesNoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3">
      {(['yes', 'no'] as const).map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? '' : opt)}
          className={`flex-1 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all ${
            value === opt
              ? 'border-primary bg-primary text-white shadow-sm'
              : 'border-gray-200 text-gray-600 hover:border-primary/60 hover:text-primary bg-white'
          }`}
        >
          {opt === 'yes' ? '✓  Yes' : '✗  No'}
        </button>
      ))}
    </div>
  );
}

interface FieldInputProps {
  field: FormField;
  value: AnswerValue;
  error?: string;
  onChange: (fieldId: string, value: AnswerValue) => void;
}

const INPUT_BASE =
  'w-full px-4 py-3 rounded-xl border-2 text-gray-800 placeholder:text-gray-400 focus:outline-none transition-colors text-sm bg-white';
const INPUT_NORMAL = 'border-gray-200 focus:border-primary';
const INPUT_ERROR = 'border-red-400 focus:border-red-500 bg-red-50';

function FieldInput({ field, value, error, onChange }: FieldInputProps) {
  const str = typeof value === 'string' ? value : '';
  const cls = `${INPUT_BASE} ${error ? INPUT_ERROR : INPUT_NORMAL}`;

  switch (field.type) {
    case 'heading':
      return (
        <div className="pt-2">
          <h3 className="text-lg font-bold text-gray-800 leading-snug">{field.question}</h3>
          {field.helpText && (
            <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
          )}
        </div>
      );

    case 'long_text':
      return (
        <textarea
          value={str}
          onChange={e => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || 'Your answer…'}
          rows={4}
          className={`${cls} resize-none`}
        />
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2.5">
          {(field.options ?? []).map(opt => {
            const selected = str === opt;
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50 bg-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected ? 'border-primary' : 'border-gray-300'
                }`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={selected}
                  onChange={() => onChange(field.id, opt)}
                  className="sr-only"
                />
                <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-gray-700'}`}>
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      );

    case 'checkboxes': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2.5">
          {(field.options ?? []).map(opt => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50 bg-white'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                }`}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter(s => s !== opt)
                      : [...selected, opt];
                    onChange(field.id, next);
                  }}
                  className="sr-only"
                />
                <span className={`text-sm font-medium ${checked ? 'text-primary' : 'text-gray-700'}`}>
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    case 'dropdown':
      return (
        <div className="relative">
          <select
            value={str}
            onChange={e => onChange(field.id, e.target.value)}
            className={`${cls} appearance-none cursor-pointer pr-10`}
          >
            <option value="">Select an option…</option>
            {(field.options ?? []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      );

    case 'yes_no':
      return <YesNoField value={str} onChange={v => onChange(field.id, v)} />;

    case 'rating':
      return (
        <StarRating
          value={Number(str) || 0}
          onChange={v => onChange(field.id, String(v))}
        />
      );

    case 'file': {
      const file = value instanceof File ? value : null;
      return (
        <div>
          <label
            className={`flex flex-col items-center justify-center gap-2.5 p-7 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:border-primary/60 hover:bg-primary/5 bg-white'
            }`}
          >
            <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-primary">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium">Click to upload a file</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, Word, Excel, images — max 10 MB</p>
              </div>
            )}
            <input
              type="file"
              className="sr-only"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={e => onChange(field.id, e.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <button
              type="button"
              onClick={() => onChange(field.id, null)}
              className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Remove file
            </button>
          )}
        </div>
      );
    }

    case 'date':
      return (
        <input
          type="date"
          value={str}
          onChange={e => onChange(field.id, e.target.value)}
          className={cls}
        />
      );

    case 'time':
      return (
        <input
          type="time"
          value={str}
          onChange={e => onChange(field.id, e.target.value)}
          className={cls}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={str}
          onChange={e => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || '0'}
          className={cls}
        />
      );

    case 'email':
      return (
        <input
          type="email"
          value={str}
          onChange={e => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || 'you@example.com'}
          className={cls}
        />
      );

    case 'phone':
      return (
        <input
          type="tel"
          value={str}
          onChange={e => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || '+234 000 000 0000'}
          className={cls}
        />
      );

    default: // short_text
      return (
        <input
          type="text"
          value={str}
          onChange={e => onChange(field.id, e.target.value)}
          placeholder={field.placeholder || 'Your answer…'}
          className={cls}
        />
      );
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ fields, answers }: { fields: FormField[]; answers: Record<string, AnswerValue> }) {
  const required = fields.filter(f => f.required && f.type !== 'heading');
  if (required.length === 0) return null;

  const answered = required.filter(f => {
    const v = answers[f.id];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }).length;

  const pct = Math.round((answered / required.length) * 100);

  return (
    <div className="px-8 py-3 bg-gray-50 border-b border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-400 font-medium">{answered} of {required.length} required fields</span>
        <span className="text-xs font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main FormPage ────────────────────────────────────────────────────────────

type PageStatus = 'loading' | 'error' | 'active' | 'submitting' | 'submitted';

export function FormPage() {
  const { slug } = useParams<{ slug: string }>();

  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState<PublicForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const hasStartedRef = useRef(false);

  // ── Load form + track view ──────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;

    (async () => {
      try {
        const res = await api.get(`/public/forms/${slug}`);
        setForm(res.data.data);
        setPageStatus('active');
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setErrorMsg(e.response?.data?.error ?? 'This form is not available.');
        setPageStatus('error');
        return;
      }

      // Fire-and-forget view tracking
      api.post(`/public/forms/${slug}/track-view`, {}).catch(() => {});
    })();
  }, [slug]);

  // ── Track start on first interaction ─────────────────────────────────────────
  const trackStart = useCallback(() => {
    if (hasStartedRef.current || !slug) return;
    hasStartedRef.current = true;
    api.post(`/public/forms/${slug}/track-start`, {}).catch(() => {});
  }, [slug]);

  // ── Handle field change ───────────────────────────────────────────────────────
  const handleChange = useCallback((fieldId: string, value: AnswerValue) => {
    trackStart();
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    setFieldErrors(prev => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, [trackStart]);

  // ── Client-side validation ────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!form) return false;
    const errors: Record<string, string> = {};

    for (const field of form.fields) {
      if (field.type === 'heading') continue;
      const val = answers[field.id];
      const empty =
        val === undefined || val === null || val === '' ||
        (Array.isArray(val) && val.length === 0);

      if (field.required && empty) {
        errors[field.id] = 'This field is required';
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to the first error field
      setTimeout(() => {
        const el = document.querySelector('[data-has-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return false;
    }

    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !slug) return;

    setServerErrors([]);
    if (!validate()) return;

    setPageStatus('submitting');

    const hasFile = form.fields.some(
      f => f.type === 'file' && answers[f.id] instanceof File
    );

    try {
      if (hasFile) {
        const fd = new FormData();
        for (const field of form.fields) {
          if (field.type === 'heading') continue;
          const val = answers[field.id];
          if (val instanceof File) {
            fd.append(field.id, val);
          } else if (Array.isArray(val)) {
            val.forEach(v => fd.append(field.id, v));
          } else if (val !== null && val !== undefined && val !== '') {
            fd.append(field.id, String(val));
          }
        }
        await api.post(`/public/forms/${slug}/submit`, fd);
      } else {
        const body: Record<string, string | string[]> = {};
        for (const field of form.fields) {
          if (field.type === 'heading') continue;
          const val = answers[field.id];
          if (Array.isArray(val) && val.length > 0) {
            body[field.id] = val;
          } else if (typeof val === 'string' && val !== '') {
            body[field.id] = val;
          }
        }
        await api.post(`/public/forms/${slug}/submit`, body);
      }

      setPageStatus('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setPageStatus('active');
      const e = err as { response?: { data?: { errors?: string[]; error?: string } } };
      if (e.response?.data?.errors?.length) {
        setServerErrors(e.response.data.errors);
      } else {
        setServerErrors([e.response?.data?.error ?? 'Submission failed. Please try again.']);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Render: loading ───────────────────────────────────────────────────────────
  if (pageStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-[3px] border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium">Loading form…</p>
        </div>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────────
  if (pageStatus === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Form Unavailable</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{errorMsg}</p>
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Powered by <span className="font-semibold text-primary">Anchor Africa</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: success ───────────────────────────────────────────────────────────
  if (pageStatus === 'submitted') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your response has been submitted successfully. We'll be in touch soon.
          </p>
          {form?.title && (
            <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
              Submitted for: <span className="font-medium">{form.title}</span>
            </p>
          )}
          <div className="mt-4">
            <p className="text-xs text-gray-400">
              Powered by <span className="font-semibold text-primary">Anchor Africa</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const hasRequiredFields = form.fields.some(f => f.required && f.type !== 'heading');

  // ── Render: form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Top branding */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-500">Anchor Africa</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Form header strip */}
          <div className="bg-primary rounded-t-2xl px-8 py-8">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
              {form.category}
            </span>
            <h1 className="text-2xl font-bold text-white leading-tight">{form.title}</h1>
            {form.description && (
              <p className="text-white/75 text-sm mt-2.5 leading-relaxed">{form.description}</p>
            )}
          </div>

          {/* Progress bar */}
          {pageStatus === 'active' && (
            <ProgressBar fields={form.fields} answers={answers} />
          )}

          {/* Server-side errors */}
          {serverErrors.length > 0 && (
            <div className="bg-red-50 border-x border-red-100 px-6 py-4 space-y-1">
              {serverErrors.map((err, i) => (
                <p key={i} className="text-sm text-red-600 flex items-start gap-2">
                  <span className="shrink-0 mt-px">•</span>
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Fields */}
          <div className="bg-white border border-t-0 border-gray-100 shadow-sm rounded-b-2xl divide-y divide-gray-50">
            {form.fields.map((field, idx) => {
              const isHeading = field.type === 'heading';
              const hasErr = !!fieldErrors[field.id];

              return (
                <div
                  key={field.id ?? idx}
                  className={isHeading ? 'px-8 py-5' : 'px-8 py-6'}
                  data-has-error={hasErr || undefined}
                >
                  {isHeading ? (
                    <FieldInput field={field} value={null} error={undefined} onChange={handleChange} />
                  ) : (
                    <>
                      <label className="block text-sm font-semibold text-gray-700 mb-1 leading-snug">
                        {field.question}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.helpText && (
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{field.helpText}</p>
                      )}
                      <FieldInput
                        field={field}
                        value={answers[field.id] ?? (field.type === 'checkboxes' ? [] : '')}
                        error={fieldErrors[field.id]}
                        onChange={handleChange}
                      />
                      {hasErr && (
                        <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors[field.id]}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Submit section */}
            <div className="px-8 py-7 bg-gray-50/60 rounded-b-2xl">
              {hasRequiredFields && (
                <p className="text-xs text-gray-400 mb-4">
                  Fields marked <span className="text-red-500 font-semibold">*</span> are required
                </p>
              )}
              <button
                type="submit"
                disabled={pageStatus === 'submitting'}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {pageStatus === 'submitting' ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Response
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-7">
          Powered by{' '}
          <span className="font-semibold text-primary">Anchor Africa</span>
          {' '}· Mental Health Support in Nigeria
        </p>
      </div>
    </div>
  );
}
