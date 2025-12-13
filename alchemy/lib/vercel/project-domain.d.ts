import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating or updating a ProjectDomain
 */
export interface ProjectDomainProps {
    /**
     * The domain name to add to the project
     */
    name: string;
    /**
     * The unique project identifier or the project name
     */
    project: string;
    /**
     * The Git branch to link the domain to
     */
    gitBranch?: string;
    /**
     * The unique custom environment identifier within the project
     */
    customEnvironment?: string;
    /**
     * The redirect target for the domain
     */
    redirect?: string;
    /**
     * The redirect status code
     */
    redirectStatusCode?: 301 | 302 | 307 | 308;
}
/**
 * Output returned after ProjectDomain creation/update
 */
export interface ProjectDomain extends ProjectDomainProps {
    apexName: string;
    /**
     * `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed.
     */
    verified: boolean;
    /**
     * The time at which the domain was created
     */
    createdAt: number;
    /**
     * The time at which the domain was last updated
     */
    updatedAt: number;
    /**
     * A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain.
     *
     * Possible challenges:
     *   - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`.
     */
    verification?: {
        /**
         * The type of verification
         */
        type: string;
        /**
         * The domain being verified
         */
        domain: string;
        /**
         * The verification value
         */
        value: string;
        /**
         * The reason for verification
         */
        reason: string;
    }[];
}
/**
 * Add and manage domains for Vercel projects.
 *
 * @example
 * // Minimal
 * const domain = await ProjectDomain("my-app.com", {
 *   name: "my-app.com",
 *   project: "prj_123",
 * });
 *
 * @example
 * // With accessToken
 * const domain = await ProjectDomain("my-app.com", {
 *   accessToken: alchemy.secret(process.env.VERCEL_ACCESS_TOKEN),
 *   name: "my-app.com",
 *   project: "prj_123",
 * });
 *
 * @example
 * // With redirect
 * const domain = await ProjectDomain("my-app.com", {
 *   name: "my-app.com",
 *   project: "prj_123",
 *   gitBranch: "main",
 *   redirect: "https://example.com",
 *   redirectStatusCode: 301,
 * });
 */
export declare const ProjectDomain: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<ProjectDomain>, _id: string, { accessToken, ...props }: ProjectDomainProps & {
    accessToken?: Secret;
}) => Promise<ProjectDomain>);
//# sourceMappingURL=project-domain.d.ts.map