"use client";

import { useState } from "react";
import Link from "next/link";
import Proximate from "@/components/variable-proximity/Proximate";
import FormConsentCheckbox from "@/components/modals/FormConsentCheckbox";
import {
  modalFieldClass,
  modalSubmitClass,
} from "@/components/modals/SplitFormModalShell";
import {
  LAST_TRAINED_OPTIONS,
  WELCOME_BACK_INTEREST,
  WELCOME_BACK_SOURCE,
} from "@/lib/welcome-back-options";

type SubmitStatus = "idle" | "loading" | "success" | "error";

type FormFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lastTrained: string;
  notes: string;
};

const emptyForm = (): FormFields => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  lastTrained: "",
  notes: "",
});

export default function WelcomeBackForm() {
  const [formData, setFormData] = useState<FormFields>(emptyForm);
  const [consent, setConsent] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitStatus("loading");
    setSubmitError("");

    try {
      const res = await fetch("/api/book-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          interest: WELCOME_BACK_INTEREST,
          notes: formData.notes,
          source: WELCOME_BACK_SOURCE,
          lastTrained: formData.lastTrained,
        }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        setSubmitStatus("error");
        setSubmitError(payload.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitStatus("success");
      setFormData(emptyForm());
      setConsent(false);
    } catch {
      setSubmitStatus("error");
      setSubmitError("Network error. Check your connection and try again.");
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="flex flex-col gap-4" role="status">
        <h2 className="font-mono text-xl font-normal text-black md:text-2xl">
          <Proximate>got it. talk soon.</Proximate>
        </h2>
        <p className="font-mono text-sm leading-relaxed text-black/75 md:text-base">
          Jason will reach out personally. While you wait, grab some gear.
        </p>
        <Link
          href="/shop"
          className="inline-block w-fit rounded-lg border border-black bg-pink-primary px-6 py-3 font-mono text-sm text-black transition-colors duration-300 hover:bg-transparent"
        >
          shop omnia
        </Link>
      </div>
    );
  }

  const disabled = submitStatus === "loading";
  const field = modalFieldClass;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          name="firstName"
          placeholder="first name"
          value={formData.firstName}
          onChange={handleChange}
          required
          autoComplete="given-name"
          disabled={disabled}
          className={field}
        />
        <input
          type="text"
          name="lastName"
          placeholder="last name"
          value={formData.lastName}
          onChange={handleChange}
          required
          autoComplete="family-name"
          disabled={disabled}
          className={field}
        />
      </div>

      <input
        type="email"
        name="email"
        placeholder="email"
        value={formData.email}
        onChange={handleChange}
        required
        autoComplete="email"
        disabled={disabled}
        className={field}
      />

      <input
        type="tel"
        name="phone"
        placeholder="phone (+1…)"
        value={formData.phone}
        onChange={handleChange}
        required
        autoComplete="tel"
        disabled={disabled}
        className={field}
      />

      <select
        name="lastTrained"
        value={formData.lastTrained}
        onChange={handleChange}
        required
        disabled={disabled}
        aria-label="When did you last train with us?"
        className={`${field} bg-white`}
      >
        <option value="" disabled>
          When did you last train with us?
        </option>
        {LAST_TRAINED_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <textarea
        name="notes"
        rows={3}
        placeholder="what are you looking for? (optional)"
        value={formData.notes}
        onChange={handleChange}
        disabled={disabled}
        className={`${field} resize-none`}
      />

      <FormConsentCheckbox
        id="welcome-back-consent"
        checked={consent}
        onChange={setConsent}
        disabled={disabled}
        includeSms
      />

      {submitStatus === "error" && submitError ? (
        <p className="font-mono text-sm text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled || !consent}
        className={modalSubmitClass}
      >
        {submitStatus === "loading" ? "sending…" : "i'm curious"}
      </button>
    </form>
  );
}
