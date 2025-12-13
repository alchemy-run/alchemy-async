/**
 * Cloudflare permission group as returned by the API
 */
export interface PermissionGroup {
    /**
     * Unique identifier for the permission group
     */
    id: string;
    /**
     * Human-readable name of the permission group
     */
    name: string;
    /**
     * Scopes included in this permission group
     */
    scopes: string[];
}
export type PermissionGroupName = (typeof PERMISSION_GROUPS)[number]["name"];
/**
 * All Cloudflare permission groups mapped by name to ID
 *
 * @see https://developers.cloudflare.com/r2/api/tokens/#permissions
 */
export type PermissionGroups = {
    [name in PermissionGroupName]: PermissionGroup;
};
/**
 * Lists all permission groups available for the Cloudflare account
 * and returns a typed map of permission names to their IDs.
 *
 * This is primarily used when creating API tokens for Cloudflare services like R2.
 *
 * Note: Requires a Cloudflare API Key or Token with account read access.
 * The API token must have permission to read token permission groups.
 * The OAuth token from `wrangler login` is NOT sufficient for this operation.
 *
 * @example
 * // Get all permission groups including those for R2
 * const permissions = await PermissionGroups();
 *
 * // Use with AccountApiToken to create a token with proper permissions
 * const token = await AccountApiToken("r2-token", {
 *   name: "R2 Read-Only Token",
 *   policies: [
 *     {
 *       effect: "allow",
 *       resources: {
 *         "com.cloudflare.edge.r2.bucket.abc123_default_my-bucket": "*"
 *       },
 *       permissionGroups: [
 *         {
 *           id: permissions["Workers R2 Storage Bucket Item Read"]
 *         }
 *       ]
 *     }
 *   ]
 * });
 */
export declare function PermissionGroups(): Promise<PermissionGroups>;
export declare const PERMISSION_GROUPS: readonly [{
    readonly id: "19637fbb73d242c0a92845d8db0b95b1";
    readonly name: "AI Audit Read";
    readonly description: "Grants access to reading AI Audit";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "1ba6ab4cacdb454b913bbb93e1b8cb8c";
    readonly name: "AI Audit Write";
    readonly description: "Grants access to reading and editing AI Audit";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "4dc8917b4b40457d88d3035d5dadb054";
    readonly name: "AI Gateway Read";
    readonly description: "Grants access to reading AI Gateways";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "644535f4ed854494a59cb289d634b257";
    readonly name: "AI Gateway Run";
    readonly description: "Grants access to run AI Gateways";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "6c8a3737f07f46369c1ea1f22138daaf";
    readonly name: "AI Gateway Write";
    readonly description: "Grants access to reading and editing AI Gateways";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "eb258a38ea634c86a0c89da6b27cb6b6";
    readonly name: "Access: Apps and Policies Read";
    readonly description: "Grants read access to Cloudflare Access zone resources";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "7ea222f6d5064cfa89ea366d7c1fee89";
    readonly name: "Access: Apps and Policies Read";
    readonly description: "Grants read access to Cloudflare Access applications and policies";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "6db4e222e21248ac96a3f4c2a81e3b41";
    readonly name: "Access: Apps and Policies Revoke";
    readonly description: "Grants ability to revoke all tokens to Cloudflare Access zone resources";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "6c9d1cfcfc6840a987d1b5bfb880a841";
    readonly name: "Access: Apps and Policies Revoke";
    readonly description: "Grants ability to revoke Cloudflare Access application tokens";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "959972745952452f8be2452be8cbb9f2";
    readonly name: "Access: Apps and Policies Write";
    readonly description: "Grants write access to Cloudflare Access zone resources";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "1e13c5124ca64b72b1969a67e8829049";
    readonly name: "Access: Apps and Policies Write";
    readonly description: "Grants write access to Cloudflare Access applications and policies";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "b05b28e839c54467a7d6cba5d3abb5a3";
    readonly name: "Access: Audit Logs Read";
    readonly description: "Grants read access to Cloudflare Access audit logs";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "08e61dabe81a422dab0dea6fdef1a98a";
    readonly name: "Access: Custom Pages Read";
    readonly description: "Grants read access to Cloudflare Access Custom Pages";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4e5fd8ac327b4a358e48c66fcbeb856d";
    readonly name: "Access: Custom Pages Write";
    readonly description: "Grants write access to Cloudflare Access Custom Pages";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "0f4841f80adb4bada5a09493300e7f8d";
    readonly name: "Access: Device Posture Read";
    readonly description: "Grants read access to Cloudflare Access Device Posture";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "2fc1072ee6b743828db668fcb3f9dee7";
    readonly name: "Access: Device Posture Write";
    readonly description: "Grants write access to Cloudflare Access Device Posture";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4f3196a5c95747b6ad82e34e1d0a694f";
    readonly name: "Access: Mutual TLS Certificates Read";
    readonly description: "Grants read access to Cloudflare Access mTLS certificates";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "29d3afbfd4054af9accdd1118815ed05";
    readonly name: "Access: Mutual TLS Certificates Write";
    readonly description: "Grants write access to Cloudflare Access mTLS certificates";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "26bc23f853634eb4bff59983b9064fde";
    readonly name: "Access: Organizations, Identity Providers, and Groups Read";
    readonly description: "Grants read access to Cloudflare Access account resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "7121a0c7e9ed46e3829f9cca2bb572aa";
    readonly name: "Access: Organizations, Identity Providers, and Groups Revoke";
    readonly description: "Grants ability to revoke user sessions to Cloudflare Access account resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "bfe0d8686a584fa680f4c53b5eb0de6d";
    readonly name: "Access: Organizations, Identity Providers, and Groups Write";
    readonly description: "Grants write access to Cloudflare Access account resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "b8b7514ce5364cd8ac0455f3eb16eb5f";
    readonly name: "Access: Policy Test Read";
    readonly description: "Grants read access to Cloudflare Access Policy Tests";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "6d23f290472f4e6fad5c4398c057c356";
    readonly name: "Access: Policy Test Write";
    readonly description: "Grants full access to Cloudflare Access Policy Tests";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "de99c87e48d642ce8c985d027905b475";
    readonly name: "Access: Population Read";
    readonly description: "Grants read access to Cloudflare Access Populations";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "bc783549a3a741aaa10556faf8b485bb";
    readonly name: "Access: Population Write";
    readonly description: "Grants write access to Cloudflare Access Populations";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e985ca9351db460faebbe8681c48e560";
    readonly name: "Access: SCIM logs read";
    readonly description: "Grants read access to SCIM audit logs";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "99ff99e4e30247a99d3777a8c4c18541";
    readonly name: "Access: SSH Auditing Read";
    readonly description: "Grants read access to Cloudflare Access SSH certificate authorities (CAs)";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "d30c9ad8b5224e7cb8d41bcb4757effc";
    readonly name: "Access: SSH Auditing Write";
    readonly description: "Grants write access to Cloudflare Access SSH certificate authorities (CAs)";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "91f7ce32fa614d73b7e1fc8f0e78582b";
    readonly name: "Access: Service Tokens Read";
    readonly description: "Grants read access to Cloudflare Access Service Tokens";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a1c0fec57cf94af79479a6d827fa518c";
    readonly name: "Access: Service Tokens Write";
    readonly description: "Grants write access to Cloudflare Access Service Tokens";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5e5d3e8efeec49f3afb67bafecbcd511";
    readonly name: "Account API Gateway";
    readonly description: "Grants full access to API-Gateway Management (including API Shield) across the whole account";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "05a2a65760a546439ed29762b163cece";
    readonly name: "Account API Gateway Read";
    readonly description: "Grants read access to API-Gateway Management (including API Shield) across the whole account";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "eb56a6953c034b9d97dd838155666f06";
    readonly name: "Account API Tokens Read";
    readonly description: "Grants read access to account API Tokens";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5bc3f8b21c554832afc660159ab75fa4";
    readonly name: "Account API Tokens Write";
    readonly description: "Grants write access to account API Tokens";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "b89a480218d04ceb98b4fe57ca29dc1f";
    readonly name: "Account Analytics Read";
    readonly description: "Grants read access to analytics";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c57ea647ef654b47bc8944fa739b570d";
    readonly name: "Account Custom Pages Read";
    readonly description: "Grants read access to account custom pages";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "8a9d35a7c8504208ad5c3e8d58e6162d";
    readonly name: "Account Custom Pages Write";
    readonly description: "Grants write access to account custom pages";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cfa964bcdafc4ab39704e7476154e41b";
    readonly name: "Account DNS Settings Read";
    readonly description: "Grants read access to Account DNS Settings";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "dc44f27f48ab405392a5f69fe822bd01";
    readonly name: "Account DNS Settings Write";
    readonly description: "Grants write access to Account DNS Settings";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "de7a688cc47d43bd9ea700b467a09c96";
    readonly name: "Account Firewall Access Rules Read";
    readonly description: "Grants read access to account firewall access rules";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a416acf9ef5a4af19fb11ed3b96b1fe6";
    readonly name: "Account Firewall Access Rules Write";
    readonly description: "Grants write access to account firewall access rules";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4f1071168de8466e9808de86febfc516";
    readonly name: "Account Rule Lists Read";
    readonly description: "Grants read access to Rule Lists";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "2edbf20661fd4661b0fe10e9e12f485c";
    readonly name: "Account Rule Lists Write";
    readonly description: "Grants write access to Rule Lists";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "fb39996ee9044d2a8725921e02744b39";
    readonly name: "Account Rulesets Read";
    readonly description: "Grants read access to Account Rulesets";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "56907406c3d548ed902070ec4df0e328";
    readonly name: "Account Rulesets Write";
    readonly description: "Grants write access to Account Rulesets";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "ece81d7757ff406cad61f221a4920d55";
    readonly name: "Account Security Center Insights Read";
    readonly description: "Grants read access to Security Center Insights";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cfa2e2893226455c9b945914969dff7c";
    readonly name: "Account Security Center Insights Write";
    readonly description: "Grants write access to Security Center Insights";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c1fde68c7bcc44588cbb6ddbc16d6480";
    readonly name: "Account Settings Read";
    readonly description: "Grants read access to Account resources, account membership, and account level features";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "1af1fa2adc104452b74a9a3364202f20";
    readonly name: "Account Settings Write";
    readonly description: "Grants write access to Account resources, account membership, and account level features";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "56b2af4817c84ad99187911dc3986c23";
    readonly name: "Account WAF Read";
    readonly description: "Grants read access to Account WAF";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cde8c82463b6414ca06e46b9633f52a6";
    readonly name: "Account WAF Write";
    readonly description: "grants write access to account waf";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "3e4e20ee40b9475dae22201c468fdb70";
    readonly name: "Account Waiting Rooms Read";
    readonly description: "Grants read access to Waiting Rooms\n";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a7a233f9604845c787d4c8c39ac09c21";
    readonly name: "Account: SSL and Certificates Read";
    readonly description: "Grants read access to SSL MTLS certificates or Certificate Store";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "db37e5f1cb1a4e1aabaef8deaea43575";
    readonly name: "Account: SSL and Certificates Write";
    readonly description: "Grants read and write access to SSL MTLS certificates or Certificate Store";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "d07270cea5484b08ad6440c985af2148";
    readonly name: "Address Maps Read";
    readonly description: "Grants read access to Address Maps";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "6ffe7f4299db4d4cb54f64e0eb12a456";
    readonly name: "Address Maps Write";
    readonly description: "Grants write access to Address Maps";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "151803815e4f47de854c2fb7f8284d57";
    readonly name: "Agents Gateway Read";
    readonly description: "Grants access to reading Agents Gateway";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "82748b814dcd46b9b3e66b8151ba5e95";
    readonly name: "Agents Gateway Run";
    readonly description: "Grants access to running Agents Gateway";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e84fd345697c4036a14e7810da036e1a";
    readonly name: "Agents Gateway Write";
    readonly description: "Grants access to reading and editing Agents Gateway";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "f3604047d46144d2a3e9cf4ac99d7f16";
    readonly name: "Allow Request Tracer Read";
    readonly description: "Allows read access to request tracer API";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "9c88f9c5bce24ce7af9a958ba9c504db";
    readonly name: "Analytics Read";
    readonly description: "Grants read access to analytics";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "d79c5e2a405b4516a322432287d40c31";
    readonly name: "Application Security Reports Read";
    readonly description: "Can read Application Security Reports";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "094547ab6e77498c8c4dfa87fadd5c51";
    readonly name: "Apps Write";
    readonly description: "Grants full access to Cloudflare Apps";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "d7887c7a417e4cf2a69f1d01c1a1dc3b";
    readonly name: "Auto Rag Read";
    readonly description: "Grants access to reading data from Auto Rag";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "7fb8d27511b34d02994d005b520b679f";
    readonly name: "Auto Rag Write";
    readonly description: "Grants access to reading and writing data from Auto Rag";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "234108c786084936a381bb19b7f4ea65";
    readonly name: "Auto Rag Write Run Engine";
    readonly description: "Grants access to run Auto RAG engine";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "7cf72faf220841aabcfdfab81c43c4f6";
    readonly name: "Billing Read";
    readonly description: "Grants read access to billing profile, subscriptions, usage data and access to fetch invoices and entitlements";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "6c80e02421494afc9ae14414ed442632";
    readonly name: "Billing Write";
    readonly description: "Grants write access to billing profile, subscriptions, and access to fetch invoices and entitlements";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "51be404b56244056868226263a44a632";
    readonly name: "Bot Management Feedback Report Read";
    readonly description: "Grants read access to BOT Management Feedback Reports";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "2002629aaff0454085bf5a201ed70a72";
    readonly name: "Bot Management Feedback Report Write";
    readonly description: "Grants write access to BOT Management Feedback Reports";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "07bea2220b2343fa9fae15656c0d8e88";
    readonly name: "Bot Management Read";
    readonly description: "Grants read access to BOT Management";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "3b94c49258ec4573b06d51d99b6416c0";
    readonly name: "Bot Management Write";
    readonly description: "Grants write access to BOT Management";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "374b03fa229f4eb6b011bb1cd7f235ee";
    readonly name: "Browser Rendering Read";
    readonly description: "Grants read access to Browser Rendering API";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "adddda876faa4a0590f1b23a038976e4";
    readonly name: "Browser Rendering Write";
    readonly description: "Grants write access to Browser Rendering API";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "da5fe84b9c5446a0a5955b673fafa288";
    readonly name: "CASB Read";
    readonly description: "Grants read access to Cloudflare CASB";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "b9ed086b20864ad89c5aac24cdd02365";
    readonly name: "CASB Write";
    readonly description: "Grants write access to Cloudflare CASB";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "47b936e2027140c0a474cac8887b8c29";
    readonly name: "CF Agents Read";
    readonly description: "Grants read access to CF Agents";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cb142f7fbc3540f0bade0cbe75f606dc";
    readonly name: "CF Agents Write";
    readonly description: "Grants write access to CF Agents";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e17beae8b8cb423a99b1730f21238bed";
    readonly name: "Cache Purge";
    readonly description: "Grants access to purge cache";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "3245da1cf36c45c3847bb9b483c62f97";
    readonly name: "Cache Settings Read";
    readonly description: "Grants read access to cache settings phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "9ff81cbbe65c400b97d92c3c1033cab6";
    readonly name: "Cache Settings Write";
    readonly description: "Grants write access to cache settings phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "686ab9a8b3854f25a1474f302d14b68d";
    readonly name: "Calls Read";
    readonly description: "Grants read access to Calls configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "b711942448db4b0aace44d1312f9fdb0";
    readonly name: "Calls Write";
    readonly description: "Grants read/write access to Calls configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "9ade9cfc8f8949bcb2371be2f0ec8db1";
    readonly name: "China Network Steering Read";
    readonly description: "Grants read access to China Network Steering";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c6f6338ceae545d0b90daaa1fed855e6";
    readonly name: "China Network Steering Write";
    readonly description: "Grants write access to China Network Steering";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "0661ff47aa3a4786beab3b8128e0cd24";
    readonly name: "Cloud Connector Read";
    readonly description: "Grants read access to Cloud Connector";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "eafd71286d0e4fdca404a7b4d203c5c9";
    readonly name: "Cloud Connector Write";
    readonly description: "Grants write access to Cloud Connector";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "9e5a9912439940fca5898b5b8dc6d1a5";
    readonly name: "Cloud Email Security: Read";
    readonly description: "Grants read access to Cloudflare Cloud Email Security";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a3567c13e074447fb101babac3463566";
    readonly name: "Cloud Email Security: Write";
    readonly description: "Grants write access to Cloudflare Cloud Email Security";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "65ec50cbde3d4c838bbe7500024d5745";
    readonly name: "Cloudchamber Read";
    readonly description: "Grants read access to Cloudchamber deployments";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "26ce6c7d18a346528e7b905d5e269866";
    readonly name: "Cloudchamber Write";
    readonly description: "Grants write access to Cloudchamber deployments";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "00ec19a0d4fa4e4aae23b50bf04c0630";
    readonly name: "Cloudflare CDS Compute Account Read";
    readonly description: "Grants read access to Cloudflare CDS compute account resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "9bf884ba0de445dab37ea4a3e1a2c9f1";
    readonly name: "Cloudflare CDS Compute Account Write";
    readonly description: "Grants write access to Cloudflare CDS compute account resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "3a1e1ef09dd34271bb44fc4c6a419952";
    readonly name: "Cloudflare DEX";
    readonly description: "Grants access to Cloudflare DEX";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "3b376e0aa52c41cbb6afc9cab945afa8";
    readonly name: "Cloudflare DEX Read";
    readonly description: "Grants read access to Cloudflare DEX";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "92c8dcd551cc42a6a57a54e8f8d3f3e3";
    readonly name: "Cloudflare DEX Write";
    readonly description: "Grants full access to Cloudflare DEX";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "1cd960c063a0448481343372c963d8c7";
    readonly name: "Cloudflare One Connector: WARP Read";
    readonly description: "Grants read access to WARP Connectors";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5b5c774a5d174ca88d046c8889648b3f";
    readonly name: "Cloudflare One Connector: WARP Write";
    readonly description: "Grants write access to WARP Connectors";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c1968d31028d4239976ec3bc4750bbf6";
    readonly name: "Cloudflare One Connector: cloudflared Read";
    readonly description: "Grants read access to cloudflared connectors";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "037b9e348b3b42d4b46ea2fcb1cfb3e7";
    readonly name: "Cloudflare One Connector: cloudflared Write";
    readonly description: "Grants write access to cloudflared connectors";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "07cf1c1952a84b13b2cd542f3d2f29ab";
    readonly name: "Cloudflare One Connectors Read";
    readonly description: "Grants read access to Cloudflare One connectors";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a7030c9c98d544e092d8b099fabb1f06";
    readonly name: "Cloudflare One Connectors Write";
    readonly description: "Grants write access to Cloudflare One connectors";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4f1276d1e7e34c32a5012bbe02ece86d";
    readonly name: "Cloudflare One Networks Read";
    readonly description: "Grants read access to Cloudflare One routes, subnets, and virtual networks";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e2980d9241cf4939bbbd74fdc43b9651";
    readonly name: "Cloudflare One Networks Write";
    readonly description: "Grants write access to Cloudflare One routes, subnets, and virtual networks";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "efea2ab8357b47888938f101ae5e053f";
    readonly name: "Cloudflare Tunnel Read";
    readonly description: "Grants access to view Cloudflare Tunnels";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c07321b023e944ff818fec44d8203567";
    readonly name: "Cloudflare Tunnel Write";
    readonly description: "Grants access to create and delete Cloudflare Tunnels";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e0e0edfbe8834df3b51424ba4fb7bb5f";
    readonly name: "Cloudflare Zero Trust Secure DNS Locations Write";
    readonly description: "Grants access to create and edit secure DNS Locations only in teams (Zero Trust)";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cf9353ed7978436e8fb20c03fce26449";
    readonly name: "Cloudforce One Read";
    readonly description: "Grants read access to Cloudforce One";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "677767156f294485b497a8f103172e7d";
    readonly name: "Cloudforce One Write";
    readonly description: "Grants read access to Cloudforce One";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "20e5ea084b2f491c86b8d8d90abff905";
    readonly name: "Config Settings Read";
    readonly description: "Grants read access to config settings phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "06f0526e6e464647bd61b63c54935235";
    readonly name: "Config Settings Write";
    readonly description: "Grants write access to config settings phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "77efc2c0724d4c4eb94bfd9656247130";
    readonly name: "Connectivity Directory Admin";
    readonly description: "Can view, edit, create, and delete Connectivity Directory Services, including the ability to create Services that bind to Cloudflare Tunnel";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "95fa65ba51fd49c4a6ac4c8c78ebac93";
    readonly name: "Connectivity Directory Bind";
    readonly description: "Can read, list, and bind to Connectivity Directory services, as well as read and list Cloudflare Tunnels";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "8764961c1edb4274be129d630b0b2671";
    readonly name: "Connectivity Directory Read";
    readonly description: "Can view Connectivity Directory services and Cloudflare Tunnels";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "eeffa4d16812430cb4a0ae9e7f46fc24";
    readonly name: "Constellation Read";
    readonly description: "Grants read access to Constellation configuration and models";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "7c81856725af47ce89a790d5fb36f362";
    readonly name: "Constellation Write";
    readonly description: "Grants write access to Constellation configuration and models";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a2b55cd504d44ef18b7ba6a7f2b8fbb1";
    readonly name: "Custom Errors Read";
    readonly description: "Grants read access to custom errors phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "a9dba34cf5814d4ab2007b4ada0045bd";
    readonly name: "Custom Errors Write";
    readonly description: "Grants write access to custom errors phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "a2431ca73b7d41f99c53303027392586";
    readonly name: "Custom Pages Read";
    readonly description: "Grants read access to custom pages";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "c244ec076974430a88bda1cdd992d0d9";
    readonly name: "Custom Pages Write";
    readonly description: "Grants write access to custom pages";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "192192df92ee43ac90f2aeeffce67e35";
    readonly name: "D1 Read";
    readonly description: "Grants read access to D1 configuration and SQL queries";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "09b2857d1c31407795e75e3fed8617a1";
    readonly name: "D1 Write";
    readonly description: "Grants write access to D1 configuration and SQL queries";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "dee7c22a57674abea8f942110b094717";
    readonly name: "DDoS Botnet Feed Read";
    readonly description: "Grants read access to Botnet Feed reports";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "0caa90c9b186447397c8b00358d34a76";
    readonly name: "DDoS Botnet Feed Write";
    readonly description: "Grants write access to Botnet Feed configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "af1c363c35ba45b9a8c682ae50eb3f99";
    readonly name: "DDoS Protection Read";
    readonly description: "Grants read access to DDoS protection";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "d44ed14bcc4340b194d3824d60edad3f";
    readonly name: "DDoS Protection Write";
    readonly description: "Grants write access to DDoS protection";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5f48a472240a4b489a21d43bd19a06e1";
    readonly name: "DNS Firewall Read";
    readonly description: "Grants read access to DNS Firewall";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "da6d2d6f2ec8442eaadda60d13f42bca";
    readonly name: "DNS Firewall Write";
    readonly description: "Grants write access to DNS Firewall";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "82e64a83756745bbbb1c9c2701bf816b";
    readonly name: "DNS Read";
    readonly description: "Grants read access to DNS";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "95d69e8d6d5144bfb0923667355d9f11";
    readonly name: "DNS View Read";
    readonly description: "Grants read access to DNS Views";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5b7aedd821a548b9bf5a2acabbce98c7";
    readonly name: "DNS View Write";
    readonly description: "Grants write access to DNS Views";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4755a26eedb94da69e1066d98aa820be";
    readonly name: "DNS Write";
    readonly description: "Grants write access to DNS";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "e199d584e69344eba202452019deafe3";
    readonly name: "Disable ESC Read";
    readonly description: "Grants read access to Cloudflare Disable ESC";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "29eefa0805f94fdfae2b058b5b52f319";
    readonly name: "Disable ESC Read";
    readonly description: "Grants read access to Cloudflare Disable ESC";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "9110d9dd749e464fb9f3961a2064efc5";
    readonly name: "Disable ESC Write";
    readonly description: "Grants write access to Cloudflare Disable ESC";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "18555e39c5ba40d284dde87eda845a90";
    readonly name: "Disable ESC Write";
    readonly description: "Grants write access to Cloudflare Disable ESC";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "f0235726de25444a84f704b7c93afadf";
    readonly name: "Domain API Gateway";
    readonly description: "Grants full access to API-Gateway Management (including API Shield)";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "6ced5d0d69b1422396909a62c38ab41b";
    readonly name: "Domain API Gateway Read";
    readonly description: "Grants read access to API-Gateway Management (including API Shield)";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "6134079371904d8ebd77931c8ca07e50";
    readonly name: "Domain Page Shield";
    readonly description: "Grants write access to Page Shield";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "945315185a8f40518bf3e9e6d0bee126";
    readonly name: "Domain Page Shield Read";
    readonly description: "Grants read access to Page Shield";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "d8e12db741544d1586ec1d6f5d3c7786";
    readonly name: "Dynamic URL Redirects Read";
    readonly description: "Grants read access to Dynamic URL Redirect";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "74e1036f577a48528b78d2413b40538d";
    readonly name: "Dynamic URL Redirects Write";
    readonly description: "Grants write access to Dynamic URL Redirect";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "5272e56105d04b5897466995b9bd4643";
    readonly name: "Email Routing Addresses Read";
    readonly description: "Grants read access to Email Routing target addresses\n";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e4589eb09e63436686cd64252a3aebeb";
    readonly name: "Email Routing Addresses Write";
    readonly description: "Grants full access to Email Routing target addresses\n";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "1b600d9d8062443e986a973f097e728a";
    readonly name: "Email Routing Rules Read";
    readonly description: "Grants read access to Email Routing rules\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "79b3ec0d10ce4148a8f8bdc0cc5f97f2";
    readonly name: "Email Routing Rules Write";
    readonly description: "Grants full access to Email Routing rules\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "1047880d37b649b49db4a504a245896f";
    readonly name: "Email Security DMARC Reports Read";
    readonly description: "Grants read access to Email Security dmarc reports\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "2eee71c9364c4cacaf469e8370f09056";
    readonly name: "Email Security DMARC Reports Write";
    readonly description: "Grants full access to Email Security dmarc reports\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "2d5b4b1f6c89487bb7184c2c1dcd3bf1";
    readonly name: "Email Sending Read";
    readonly description: "Grants access to reading data from Email Sending";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5df633d6b41c42bcaf5b4a62b9d14b64";
    readonly name: "Email Sending Write";
    readonly description: "Grants access to reading and writing data from Email Sending";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4ec32dfcb35641c5bb32d5ef1ab963b4";
    readonly name: "Firewall Services Read";
    readonly description: "Grants read access to Firewall resources";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "43137f8d07884d3198dc0ee77ca6e79b";
    readonly name: "Firewall Services Write";
    readonly description: "Grants write access to Firewall resources";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "a2c61201f92a4e06a901f156795388a9";
    readonly name: "Firewall for AI Read";
    readonly description: "Grants read access to Firewall for AI settings.";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "5af6a2f284144e95a89840408439adef";
    readonly name: "Firewall for AI Write";
    readonly description: "Grants full access to Firewall for AI settings.";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "0d24e472a9654642a97df736e8b0d980";
    readonly name: "Fraud Detection Read";
    readonly description: "Grants read access to Fraud Detection";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "685f9605fd4e44ec937b6a0db658e629";
    readonly name: "Fraud Detection Write";
    readonly description: "Grants write access to Fraud Detection";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "6b60a5a87cae475da7e76e77e4209dd5";
    readonly name: "HTTP Applications Read";
    readonly description: "Grants read-only access to HTTP Applications";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4736c02a9f224c8196ae5b127beae78c";
    readonly name: "HTTP Applications Write";
    readonly description: "Grants full access to HTTP Applications";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c49f8d15f9f44885a544d945ef5aa6ae";
    readonly name: "HTTP DDoS Managed Ruleset Read";
    readonly description: "Grants read access to HTTP DDoS Managed Ruleset";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "b88a3aa889474524bccea5cf18f122bf";
    readonly name: "HTTP DDoS Managed Ruleset Write";
    readonly description: "Grants write access to HTTP DDoS Managed Ruleset";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "fac65912d42144aa86b7dd33281bf79e";
    readonly name: "Health Checks Read";
    readonly description: "Grants read access to Health Checks";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "e0dc25a0fbdf4286b1ea100e3256b0e3";
    readonly name: "Health Checks Write";
    readonly description: "Grants write access to Health Checks";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "4d62ccf834df44808bc9283d65c4e4e9";
    readonly name: "Hyperdrive Read";
    readonly description: "Grants read access to Hyperdrive configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "721b2f51fba74871bd361de65aeb7e03";
    readonly name: "Hyperdrive Write";
    readonly description: "Grants write access to Hyperdrive configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "212c9ff247b9406d990c017482afb3a5";
    readonly name: "IOT Read";
    readonly description: "Grants read access to IOT devices";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "865ebd55bc6d4b109de6813eccfefd13";
    readonly name: "IOT Write";
    readonly description: "Grants full access to IOT devices";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e763fae6ee95443b8f56f19213c5f2a5";
    readonly name: "IP Prefixes: BGP On Demand Read";
    readonly description: "Grants access to read ip prefix bgp configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "2ae23e4939d54074b7d252d27ce75a77";
    readonly name: "IP Prefixes: BGP On Demand Write";
    readonly description: "Grants access to read and change ip prefix bgp configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "27beb7f8333b41e2b946f0e23cd8091e";
    readonly name: "IP Prefixes: Read";
    readonly description: "Grants access to read ip prefix settings";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "92b8234e99f64e05bbbc59e1dc0f76b6";
    readonly name: "IP Prefixes: Write";
    readonly description: "Grants access to read/write ip prefix settings";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "0cf6473ad41449e7b7b743d14fc20c60";
    readonly name: "Images Read";
    readonly description: "Grants read access to Images";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "618ec6c64a3a42f8b08bdcb147ded4e4";
    readonly name: "Images Write";
    readonly description: "Grants write access to upload Images";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c6f97eeee13345db8cc00af0953a42de";
    readonly name: "Integration Write";
    readonly description: "Grants write access to integrations";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "df1577df30ee46268f9470952d7b0cdf";
    readonly name: "Intel Read";
    readonly description: "Grants read access to Intel API";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "92209474242d459690e2cdb1985eaa6c";
    readonly name: "Intel Write";
    readonly description: "Grants write access to Intel API";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4657621393f94f83b8ef94adba382e48";
    readonly name: "L4 DDoS Managed Ruleset Read";
    readonly description: "Grants read access to L4 DDoS Managed Ruleset";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "7a4c3574054a4d0ba7c692893ba8bdd4";
    readonly name: "L4 DDoS Managed Ruleset Write";
    readonly description: "Grants write access to L4 DDoS Managed Ruleset";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "59059f0c977b44f8b1c18e0aaf91c369";
    readonly name: "Load Balancers Account Read";
    readonly description: "Grants read access to account load balancers and associated resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "419ec42810af4659ade77716dbe47bc6";
    readonly name: "Load Balancers Account Write";
    readonly description: "Grants write access to account load balancers and associated resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e9a975f628014f1d85b723993116f7d5";
    readonly name: "Load Balancers Read";
    readonly description: "Grants read access to load balancers and associated resources";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "6d7f2f5f5b1d4a0e9081fdc98d432fd1";
    readonly name: "Load Balancers Write";
    readonly description: "Grants write access to load balancers and associated resources";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "9d24387c6e8544e2bc4024a03991339f";
    readonly name: "Load Balancing: Monitors and Pools Read";
    readonly description: "Grants read access to account level load balancer resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "d2a1802cc9a34e30852f8b33869b2f3c";
    readonly name: "Load Balancing: Monitors and Pools Write";
    readonly description: "Grants write access to account level load balancer resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "6a315a56f18441e59ed03352369ae956";
    readonly name: "Logs Read";
    readonly description: "Grants read access to logs and logpush jobs";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c4a30cd58c5d42619c86a3c36c441e2d";
    readonly name: "Logs Read";
    readonly description: "Grants read access to logs and logpush jobs";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "96163bd1b0784f62b3e44ed8c2ab1eb6";
    readonly name: "Logs Write";
    readonly description: "Grants write access to logpush jobs";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "3e0b5820118e47f3922f7c989e673882";
    readonly name: "Logs Write";
    readonly description: "Grants write access to logpush jobs";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "b84a912ebb4a418888fec65f65c8ff3b";
    readonly name: "MCP Portals Read";
    readonly description: "Grants access to reading MCP Portals";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "db3d398df73946acb755c05b69edfc30";
    readonly name: "MCP Portals Write";
    readonly description: "Grants access to reading and editing MCP Portals";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "3a46c728a0a040d5a65cd8e2f3bc6935";
    readonly name: "Magic Firewall Packet Captures - Read PCAPs API";
    readonly description: "Grants read access to Packet Captures";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "4ea7d6421801452dbf07cef853a5ef39";
    readonly name: "Magic Firewall Packet Captures - Write PCAPs API";
    readonly description: "Grants write access to Packet Captures";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "02b71f12bb0748e9af8126494e181342";
    readonly name: "Magic Firewall Read";
    readonly description: "Grants read access to Magic Firewall";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "8bd1dac84d3d43e7bfb43145f010a15c";
    readonly name: "Magic Firewall Write";
    readonly description: "Grants write access to Magic Firewall";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "8e6ed1ef6e864ad0ae477ceffa5aa5eb";
    readonly name: "Magic Network Monitoring Admin";
    readonly description: "Grants admin access to MNM settings";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "3d85e9514f944bb4912c5871d92e5af5";
    readonly name: "Magic Network Monitoring Config Read";
    readonly description: "Grants read access to MNM config and rules";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "09c77baecb6341a2b1ca2c62b658d290";
    readonly name: "Magic Network Monitoring Config Write";
    readonly description: "Grants write access to MNM rules and update access to account settings";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "967ecf860a244dd1911a0331a0af582a";
    readonly name: "Magic Transit Read";
    readonly description: "Grants read access to Magic Transit";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "0bc09a3cd4b54605990df4e307f138e1";
    readonly name: "Magic Transit Write";
    readonly description: "Grants write access to Magic Transit";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "17fc856c4ebe49d4bb70f8e4744398cf";
    readonly name: "Magic WAN Read";
    readonly description: "Grants read access to Magic WAN";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a1a7389ba7e441dba95852e10970fcc3";
    readonly name: "Magic WAN Write";
    readonly description: "Grants write access to Magic WAN";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "319f5059d33a410da0fac4d35a716157";
    readonly name: "Managed headers Read";
    readonly description: "Grants read access to managed headers phases";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "0fd9d56bc2da43ad8ea22d610dd8cab1";
    readonly name: "Managed headers Write";
    readonly description: "Grants write access to managed headers phases";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "429a068902904c5a9ed9fc267c67da9a";
    readonly name: "Mass URL Redirects Read";
    readonly description: "Grants read access to Mass URL Redirect";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "abe78e2276664f4db588c1f675a77486";
    readonly name: "Mass URL Redirects Write";
    readonly description: "Grants write access to Mass URL Redirect";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "ce18edbdcebf465e9d6d1d2fc80ffd42";
    readonly name: "Notifications Read";
    readonly description: "Grants read access to notifications";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "c3c847c5802d4ce3ba00e3e97b3c8555";
    readonly name: "Notifications Write";
    readonly description: "Grants write access to Notifications";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "7b32a91ece3140d4b3c2c56f23fc8e35";
    readonly name: "Origin Read";
    readonly description: "Grants read access to origin phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "a4308c6855c84eb2873e01b6cc85cbb3";
    readonly name: "Origin Write";
    readonly description: "Grants write access to origin phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "b415b70a4fd1412886f164451f20405c";
    readonly name: "Page Rules Read";
    readonly description: "Grants read access to Page Rules";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "ed07f6c337da4195b4e72a1fb2c6bcae";
    readonly name: "Page Rules Write";
    readonly description: "Grants write access to Page Rules";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "440e6958bcc947329f8d56328d7322ce";
    readonly name: "Page Shield";
    readonly description: "Grants write access to Page Shield";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "050531528b044d58bbb71666fef7c07c";
    readonly name: "Page Shield Read";
    readonly description: "Grants read access to Page Shield across the whole account";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "87065285ab38463481e72815eefd18c3";
    readonly name: "Page Shield Write";
    readonly description: "Grants write access to Page Shield";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "e247aedd66bd41cc9193af0213416666";
    readonly name: "Pages Read";
    readonly description: "Grants read access to Cloudflare Pages";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "8d28297797f24fb8a0c332fe0866ec89";
    readonly name: "Pages Write";
    readonly description: "Grants write access to Cloudflare Pages";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "14b9cf2f410f4c0c9a16bb10a81c0e0b";
    readonly name: "Pipelines Read";
    readonly description: "Grants read access to Cloudflare Pipelines";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5606e7405dc542949d949d59993d321f";
    readonly name: "Pipelines Send";
    readonly description: "Grants access to Send Events to Cloudflare Pipelines";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e34111af393449539859485aa5ddd5bd";
    readonly name: "Pipelines Write";
    readonly description: "Grants write access to Cloudflare Pipelines";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "fd7f886c75a244389e892c4c3c068292";
    readonly name: "Pubsub Configuration Read";
    readonly description: "Grants read access to Pubsub Configurations\n";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "910b6ecca1c5411bb894e787362d1312";
    readonly name: "Pubsub Configuration Write";
    readonly description: "Grants full access to Pubsub Configurations\n";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "84a7755d54c646ca87cd50682a34bf7c";
    readonly name: "Queues Read";
    readonly description: "Grants read access to Cloudflare Queues";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "366f57075ffc42689627bcf8242a1b6d";
    readonly name: "Queues Write";
    readonly description: "Grants write access to Cloudflare Queues";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "dfe525ec7b07472c827d8d009178b2ac";
    readonly name: "Radar Read";
    readonly description: "Grants access to reading Radar";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "de62b15d79cc4d8d9c7b443c656eadbd";
    readonly name: "Realtime";
    readonly description: "Grants access to Realtime configuration excluding sensitive data";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "ba6ce7d23a9544ccad0816691ba38e21";
    readonly name: "Realtime Admin";
    readonly description: "Grants admin access to Realtime configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "9bb90620717647a39679e1d951f140d6";
    readonly name: "Registrar Domains Read";
    readonly description: "Grants read access to Cloudflare Registrar domains";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "93ae59e7a40c4287a57ff6e501186a63";
    readonly name: "Response Compression Read";
    readonly description: "Grants read access to the response compression phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "4bd3fb513a23494aa1341a7e1eb6e080";
    readonly name: "Response Compression Write";
    readonly description: "Grants write access to the response compression phase";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "58abbad6d2ce40abb2594fbe932a2e0e";
    readonly name: "Rule Policies Read";
    readonly description: "Grants read access to Rule Policies";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "61ddc58f1da14f95b33b41213360cbeb";
    readonly name: "Rule Policies Write";
    readonly description: "Grants write access to Rule Policies";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "d5812c023a5048b4882175a28952362d";
    readonly name: "SCIM Provisioning";
    readonly description: "Grants membership permissions needed for SCIM provisioning";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "7b7216b327b04b8fbc8f524e1f9b7531";
    readonly name: "SSL and Certificates Read";
    readonly description: "Grants read access to SSL configuration and cert management";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "c03055bc037c4ea9afb9a9f104b7b721";
    readonly name: "SSL and Certificates Write";
    readonly description: "Grants write access to SSL configuration and cert management";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "1d80f6f165ea47f2b55d4a393fd697de";
    readonly name: "SSO Connector Read";
    readonly description: "Grants read access to Cloudflare SSO connectors\n";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "901ca5e292584c6aa1b4cdb39248bb07";
    readonly name: "SSO Connector Write";
    readonly description: "Grants write access to Cloudflare SSO connectors\n";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "853643ed57244ed1a05a7c024af9ab5a";
    readonly name: "Sanitize Read";
    readonly description: "Grants read access to sanitization";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "89bb8c37d46042e98b84560eaaa6379f";
    readonly name: "Sanitize Write";
    readonly description: "Grants write access to sanitization";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "5e33b7d77788455c9fdf18cbd38ee5a0";
    readonly name: "Secrets Store Read";
    readonly description: "Grants read access to Secrets Store";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "adc8fa2bc6124928a8b3314dc63a1235";
    readonly name: "Secrets Store Write";
    readonly description: "Grants write access to Secrets Store";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "595409c54a24444b80a495620b2d614c";
    readonly name: "Select Configuration Read";
    readonly description: "Grants read access to select configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "235eac9bb64942b49cb805cc851cb000";
    readonly name: "Select Configuration Write";
    readonly description: "Grants write access to select configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "74c654eb4aac40e28d6c6caa4c5aeb3d";
    readonly name: "Snippets Read";
    readonly description: "Grants read access to Snippets";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "dadeaf3abdf14126a77a35e0c92fc36e";
    readonly name: "Snippets Write";
    readonly description: "Grants write access to Snippets";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "de21485a24744b76a004aa153898f7fe";
    readonly name: "Stream Read";
    readonly description: "Grants read access to Cloudflare Stream";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "714f9c13a5684c2885a793f5edb36f59";
    readonly name: "Stream Write";
    readonly description: "Grants write access to Cloudflare Stream";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a9a99455bf3245f6a5a244f909d74830";
    readonly name: "Transform Rules Read";
    readonly description: "Grants read access to transform rules";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "ae16e88bc7814753a1894c7ce187ab72";
    readonly name: "Transform Rules Write";
    readonly description: "Grants write access to transform rules";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "f0ba3733e746429182fcd40ec648c066";
    readonly name: "Trust and Safety Read";
    readonly description: "Grants access to read abuse reports and abuse actions";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "120f843a9c074f399b830e542e5616b8";
    readonly name: "Trust and Safety Write";
    readonly description: "Grants access to interact with abuse reports and abuse actions";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5d78fd7895974fd0bdbbbb079482721b";
    readonly name: "Turnstile Sites Read";
    readonly description: "Grants read access to Turnstile";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "755c05aa014b4f9ab263aa80b8167bd8";
    readonly name: "Turnstile Sites Write";
    readonly description: "Grants write access to Turnstile";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "5d613a610b294788a29572aaac2f254d";
    readonly name: "URL Scanner Read";
    readonly description: "Grants read access to URL Scanner API";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "2a400bcb29154daab509fe07e3facab0";
    readonly name: "URL Scanner Write";
    readonly description: "Grants write access to URL Scanner API";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "1799edaae5db489294430e20d9b519e0";
    readonly name: "Vectorize Read";
    readonly description: "Grants read access to Vectorize configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "64156ba5be47441096c83c7fc17c488b";
    readonly name: "Vectorize Write";
    readonly description: "Grants write access to Vectorize configuration";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cab5202d07ef47beae788e6bc95cb6fe";
    readonly name: "Waiting Rooms Read";
    readonly description: "Grants read access to Waiting Rooms\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "24fc124dc8254e0db468e60bf410c800";
    readonly name: "Waiting Rooms Write";
    readonly description: "Grants write access to Waiting Rooms\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "8e31f574901c42e8ad89140b28d42112";
    readonly name: "Web3 Hostnames Read";
    readonly description: "Grants read access to Web3 Hostnames\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "5ea6da42edb34811a78d1b007557c0ca";
    readonly name: "Web3 Hostnames Write";
    readonly description: "Grants write access to Web3 Hostnames\n";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "a92d2450e05d4e7bb7d0a64968f83d11";
    readonly name: "Workers AI Read";
    readonly description: "Grants access to invoke Workers AI models";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "bacc64e0f6c34fc0883a1223f938a104";
    readonly name: "Workers AI Write";
    readonly description: "Grants access to invoke Workers AI models and edit assets";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "ad99c5ae555e45c4bef5bdf2678388ba";
    readonly name: "Workers CI Read";
    readonly description: "Grants read access to Workers CI";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "2e095cf436e2455fa62c9a9c2e18c478";
    readonly name: "Workers CI Write";
    readonly description: "Grants write access to Workers CI";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cfd39eebc07c4e3ea849e4b3d2644637";
    readonly name: "Workers Containers Read";
    readonly description: "Grants read access to Workers Containers";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "bdbcd690c763475a985e8641dddc09f7";
    readonly name: "Workers Containers Write";
    readonly description: "Grants write access to Workers Containers";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "8b47d2786a534c08a1f94ee8f9f599ef";
    readonly name: "Workers KV Storage Read";
    readonly description: "Grants read access to Cloudflare Workers KV Storage";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "f7f0eda5697f475c90846e879bab8666";
    readonly name: "Workers KV Storage Write";
    readonly description: "Grants write access to Cloudflare Workers KV Storage";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "66c1ed49f4ed46098b75696a6d4ee3c9";
    readonly name: "Workers Observability Read";
    readonly description: "Grants read access to Cloudflare Workers Observability";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "29c629fb7b5e4c408ca0f7b545724fcc";
    readonly name: "Workers Observability Telemetry Write";
    readonly description: "Grants write access for Telemetry to Cloudflare Workers Observability";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "82c075da3f4647a2a03becd0fe240f8a";
    readonly name: "Workers Observability Write";
    readonly description: "Grants read and write access to Cloudflare Workers Observability";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "45db74139a62490b9b60eb7c4f34994b";
    readonly name: "Workers R2 Data Catalog Read";
    readonly description: "Grants read access to R2 Data Catalog";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "d229766a2f7f4d299f20eaa8c9b1fde9";
    readonly name: "Workers R2 Data Catalog Write";
    readonly description: "Grants write access to R2 Data Catalog";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "f45430d92e2b4a6cb9f94f2594c141b8";
    readonly name: "Workers R2 SQL Read";
    readonly description: "Grants access to read-only SQL queries against R2 Data Catalog";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "6a018a9f2fc74eb6b293b0c548f38b39";
    readonly name: "Workers R2 Storage Bucket Item Read";
    readonly description: "Grants read access to Cloudflare R2 Bucket Scoped Storage";
    readonly scopes: readonly ["com.cloudflare.edge.r2.bucket"];
}, {
    readonly id: "2efd5506f9c8494dacb1fa10a3e7d5b6";
    readonly name: "Workers R2 Storage Bucket Item Write";
    readonly description: "Grants write access to Cloudflare R2 Bucket Scoped Storage";
    readonly scopes: readonly ["com.cloudflare.edge.r2.bucket"];
}, {
    readonly id: "b4992e1108244f5d8bfbd5744320c2e1";
    readonly name: "Workers R2 Storage Read";
    readonly description: "Grants read access to Cloudflare R2 Storage";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "bf7481a1826f439697cb59a20b22293e";
    readonly name: "Workers R2 Storage Write";
    readonly description: "Grants write access to Cloudflare R2 Storage";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "2072033d694d415a936eaeb94e6405b8";
    readonly name: "Workers Routes Read";
    readonly description: "Grants read access to Cloudflare Workers and Workers KV Storage";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "28f4b596e7d643029c524985477ae49a";
    readonly name: "Workers Routes Write";
    readonly description: "Grants write access to Cloudflare Workers and Workers KV Storage";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "1a71c399035b4950a1bd1466bbe4f420";
    readonly name: "Workers Scripts Read";
    readonly description: "Grants read access to Cloudflare Workers scripts";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "e086da7e2179491d91ee5f35b3ca210a";
    readonly name: "Workers Scripts Write";
    readonly description: "Grants write access to Cloudflare Workers scripts";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "05880cd1bdc24d8bae0be2136972816b";
    readonly name: "Workers Tail Read";
    readonly description: "Grants `wrangler tail` read permissions";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cdeb15b336e640a2965df8c65052f1e0";
    readonly name: "Zaraz Admin";
    readonly description: "Can edit and publish Zaraz settings.";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "89d5bf002389496e9994b8c30608b5d0";
    readonly name: "Zaraz Edit";
    readonly description: "Can edit Zaraz settings.";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "5bdbde7e76144204a244274eac3eb0eb";
    readonly name: "Zaraz Read";
    readonly description: "Grants read access to Zaraz settings.";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "3f376c8e6f764a938b848bd01c8995c4";
    readonly name: "Zero Trust Read";
    readonly description: "Grants read access to Cloudflare Zero Trust resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "efb81b5cd37d49f3be1da9363a6d7a19";
    readonly name: "Zero Trust Report";
    readonly description: "Grants reporting access to Cloudflare Zero Trust";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "07f91e3e32b647ffae0178d884f23ee0";
    readonly name: "Zero Trust Resilience Read";
    readonly description: "Grants read access to Cloudflare Zero Trust Resilience resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "cc00ebddebca4b8399607562a78df084";
    readonly name: "Zero Trust Resilience Write";
    readonly description: "Grants write access to Cloudflare Zero Trust Resilience resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "b33f02c6f7284e05a6f20741c0bb0567";
    readonly name: "Zero Trust Write";
    readonly description: "Grants write access to Cloudflare Zero Trust resources";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "f5d857f67f144e3c8bacea88c17d4a13";
    readonly name: "Zero Trust: PII Read";
    readonly description: "Grants read access to Cloudflare Zero Trust PII.";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "a1a6298e52584c8fb6313760a30c681e";
    readonly name: "Zero Trust: Seats Write";
    readonly description: "Grants write access to the Zero Trust seats your organization can use (and be billed for)";
    readonly scopes: readonly ["com.cloudflare.api.account"];
}, {
    readonly id: "0a6cfe8cd3ed445e918579e2fb13087b";
    readonly name: "Zone DNS Settings Read";
    readonly description: "Grants read access to Zone DNS Settings";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "c4df38be41c247b3b4b7702e76eadae0";
    readonly name: "Zone DNS Settings Write";
    readonly description: "Grants write access to Zone DNS Settings";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "c8fed203ed3043cba015a93ad1616f1f";
    readonly name: "Zone Read";
    readonly description: "Grants read access to zone management";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "517b21aee92c4d89936c976ba6e4be55";
    readonly name: "Zone Settings Read";
    readonly description: "Grants read access to zone settings";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "3030687196b94b638145a3953da2b699";
    readonly name: "Zone Settings Write";
    readonly description: "Grants write access to zone settings";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "211a4c0feb3e43b3a2d41f1443a433e7";
    readonly name: "Zone Transform Rules Read";
    readonly description: "Grants read access to transform rules at zone level";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "0ac90a90249747bca6b047d97f0803e9";
    readonly name: "Zone Transform Rules Write";
    readonly description: "Grants write access to transform rules at zone level";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "1b1ea24cf0904d33903f0cc7e54e280f";
    readonly name: "Zone Versioning Read";
    readonly description: "Grants read-only access to Zone Versioning";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "c9915d86fbff46af9dd945c0a882294b";
    readonly name: "Zone Versioning Write";
    readonly description: "Grants full access to Zone Versioning";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "dbc512b354774852af2b5a5f4ba3d470";
    readonly name: "Zone WAF Read";
    readonly description: "Grants read access to Zone WAF";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "fb6778dc191143babbfaa57993f1d275";
    readonly name: "Zone WAF Write";
    readonly description: "Grants write access to Zone WAF";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}, {
    readonly id: "e6d2666161e84845a636613608cee8d5";
    readonly name: "Zone Write";
    readonly description: "Grants write access to zone management";
    readonly scopes: readonly ["com.cloudflare.api.account.zone"];
}];
//# sourceMappingURL=permission-groups.d.ts.map