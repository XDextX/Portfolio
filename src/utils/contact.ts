import type { ContactItem } from "../types/contact";

/** How long a copy control shows its feedback label, in ms (spec 018 RF-5). */
export const FEEDBACK_MS = 1500;

/**
 * The label a contact shows: its proper name, or its locale key translated.
 * @param item a contact with `label` or `labelKey` @param translate the locale's t()
 * @returns the visible label
 */
export function contactLabel(item: Pick<ContactItem, "label" | "labelKey">, translate: (key: string) => string): string {
    return item.label ?? translate(item.labelKey ?? "");
}

/**
 * What a copy control writes: the address for email and phone, a profile's full https URL.
 * @param item the contact
 * @returns the text to copy (the https URL is the owner's decision)
 */
export function copyValue(item: ContactItem): string {
    return item.kind === "email" || item.kind === "phone" ? item.value : item.href;
}
