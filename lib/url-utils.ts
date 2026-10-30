/**
 * Shared URL / template validation utilities.
 * Safe to import in both client and server code.
 */

/** Regex that matches a Handlebars-style template token: {{...}} */
const TEMPLATE_TOKEN = /\{\{[^}]+\}\}/;

/**
 * Returns true when the value is either:
 *  - a valid absolute URL  (http:// or https://)
 *  - a string that contains at least one {{...}} template token
 *    (the rendered value will be validated at execution time)
 */
export function isValidEndpoint(value: string): boolean {
    if (TEMPLATE_TOKEN.test(value)) return true;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

