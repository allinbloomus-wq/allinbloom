/**
 * Shared form-control class system. Every text input, select trigger,
 * textarea, checkbox and label on the public site and in admin should use
 * these so controls look identical everywhere.
 *
 * Public controls are h-11, admin controls h-10; everything else is shared.
 * Custom dropdowns (.custom-select-*) in globals.css mirror these tokens.
 */

const fieldBase =
  "w-full min-w-0 max-w-full border bg-white text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-400 disabled:cursor-not-allowed disabled:opacity-60";

const fieldValid =
  "border-stone-300 focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:rgba(var(--brand-rgb),0.18)]";

const fieldInvalid =
  "border-red-400 focus:border-red-400 ring-2 ring-red-100 focus:ring-red-100";

const state = (invalid?: boolean) => (invalid ? fieldInvalid : fieldValid);

/** Single-line input (public site, h-11). */
export const inputClass = (invalid?: boolean) =>
  `${fieldBase} h-11 rounded-full px-4 ${state(invalid)}`;

/** Single-line input (admin, h-10). */
export const adminInputClass = (invalid?: boolean) =>
  `${fieldBase} h-10 rounded-full px-4 ${state(invalid)}`;

/** Multi-line textarea (public + admin). */
export const textareaClass = (invalid?: boolean) =>
  `${fieldBase} rounded-2xl px-4 py-3 ${state(invalid)}`;

/** Wrapper around a native date/time input (focus-within styling). */
export const dateWrapClass = (invalid?: boolean, admin?: boolean) =>
  `relative ${admin ? "h-10" : "h-11"} w-full min-w-0 max-w-full overflow-hidden rounded-full border bg-white transition-colors ${
    invalid
      ? "border-red-400 ring-2 ring-red-100"
      : "border-stone-300 focus-within:border-[color:var(--brand)] focus-within:ring-2 focus-within:ring-[color:rgba(var(--brand-rgb),0.18)]"
  }`;

/** Field label (wraps the control, stacked). */
export const labelClass = "flex min-w-0 flex-col gap-2 text-sm font-medium text-stone-700";

/** Label text alone (when the label element is laid out elsewhere). */
export const labelTextClass = "text-sm font-medium text-stone-700";

/** Native checkbox / radio. */
export const checkboxClass =
  "h-4 w-4 shrink-0 cursor-pointer accent-[color:var(--brand)] disabled:cursor-not-allowed disabled:opacity-60";
