import { type Result } from "neverthrow";
interface ValidateNodeCompatProps {
    compatibilityDate: string;
    compatibilityFlags: string[];
    noBundle: boolean;
}
/**
 * Computes and validates the Node.js compatibility mode we are running.
 *
 * NOTES:
 * - The v2 mode is configured via `nodejs_compat_v2` compat flag or via `nodejs_compat` plus a compatibility date of Sept 23rd. 2024 or later.
 * - See `EnvironmentInheritable` for `noBundle`.
 *
 * @param compatibilityDateStr The compatibility date
 * @param compatibilityFlags The compatibility flags
 * @param noBundle Whether to skip internal build steps and directly deploy script
 *
 */
export declare function validateNodeCompat({ compatibilityDate, compatibilityFlags, noBundle, }: ValidateNodeCompatProps): Result<"v2" | "als" | null, string>;
export {};
//# sourceMappingURL=validate-node-compat.d.ts.map