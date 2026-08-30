"use client";

import { useState } from "react";

interface CustomerFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormValues>;
  submitLabel: string;
  submitting?: boolean;
  serverError?: string | null;
  onSubmit: (
    values: CustomerFormValues,
  ) => Promise<void>;
}

const EMPTY_VALUES: CustomerFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export function CustomerForm({
  initialValues,
  submitLabel,
  submitting = false,
  serverError,
  onSubmit,
}: Readonly<CustomerFormProps>) {
  const [values, setValues] =
    useState<CustomerFormValues>({
      ...EMPTY_VALUES,
      ...initialValues,
    });

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  function updateField(
    field: keyof CustomerFormValues,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!values.firstName.trim()) {
      nextErrors.firstName =
        "First name is required.";
    }

    if (!values.phone.trim()) {
      nextErrors.phone =
        "Phone number is required.";
    }

    if (values.email.trim()) {
      const validEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          values.email.trim(),
        );

      if (!validEmail) {
        nextErrors.email =
          "Enter a valid email address.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="First name"
          required
          value={values.firstName}
          error={errors.firstName}
          onChange={(value) =>
            updateField("firstName", value)
          }
        />

        <Field
          label="Last name"
          value={values.lastName}
          error={errors.lastName}
          onChange={(value) =>
            updateField("lastName", value)
          }
        />

        <Field
          label="Phone"
          required
          value={values.phone}
          error={errors.phone}
          onChange={(value) =>
            updateField("phone", value)
          }
        />

        <Field
          label="Email"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(value) =>
            updateField("email", value)
          }
        />
      </div>

      <Field
        label="Address"
        value={values.address}
        error={errors.address}
        onChange={(value) =>
          updateField("address", value)
        }
      />

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>

        <textarea
          id="notes"
          value={values.notes}
          onChange={(event) =>
            updateField(
              "notes",
              event.target.value,
            )
          }
          rows={5}
          maxLength={2000}
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
          placeholder="Preferences, fitting notes, or other useful information..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Saving..."
          : submitLabel}
      </button>
    </form>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function Field({
  label,
  required,
  type = "text",
  value,
  error,
  onChange,
}: Readonly<FieldProps>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
      />

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}