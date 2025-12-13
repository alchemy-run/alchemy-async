import type { CloudflareApi } from "./api.ts";
export type BotManagement = BotFightModeConfiguration | SuperBotFightModeDefinitelyConfiguration | SuperBotFightModeLikelyConfiguration | SubscriptionConfiguration;
/**
 * Bot Management configuration types
 * See Cloudflare API: https://developers.cloudflare.com/api/resources/bot_management/methods/update/
 */
/**
 * Action to apply to traffic classified by Super Bot Fight Mode.
 * Maps to Cloudflare API values for SBFM: sbfm_* fields.
 */
export type SbfmAction = "allow" | "block" | "challenge";
/**
 * Bot Fight Mode plan configuration.
 * Maps to Cloudflare API: fight_mode, ai_bots_protection, crawler_protection,
 * enable_js, is_robots_txt_managed, optimize_wordpress, suppress_session_score
 */
export interface BotFightModeConfiguration {
    /** Enable or disable Bot Fight Mode (fight_mode) */
    fightMode?: boolean;
    /** Configure AI bot protection behavior (ai_bots_protection): "block" or "none" */
    aiBotsProtection?: "block" | "none";
    /** Enable or disable crawler protection (crawler_protection): "enabled" or "disabled" */
    crawlerProtection?: "enabled" | "disabled";
    /** Require JavaScript challenges for suspicious traffic (enable_js) */
    enableJs?: boolean;
    /** Manage robots.txt via Cloudflare (is_robots_txt_managed) */
    isRobotsTxtManaged?: boolean;
    /** Optimize protections for WordPress (optimize_wordpress) */
    optimizeWordpress?: boolean;
    /** Suppress session score collection (suppress_session_score) */
    suppressSessionScore?: boolean;
}
/**
 * Super Bot Fight Mode Likely plan configuration.
 * Maps to Cloudflare API: sbfm_likely_automated, sbfm_verified_bots,
 * sbfm_static_resource_protection, optimize_wordpress, suppress_session_score, fight_mode
 */
export interface SuperBotFightModeLikelyConfiguration {
    /** Action for likely automated traffic (sbfm_likely_automated) */
    sbfmLikelyAutomated?: SbfmAction;
    /** Handling for verified bots (sbfm_verified_bots): "allow" or "challenge" */
    sbfmVerifiedBots?: "allow" | "challenge";
    /** Protect static resources from automated requests (sbfm_static_resource_protection) */
    sbfmStaticResourceProtection?: boolean;
    /** Optimize protections for WordPress (optimize_wordpress) */
    optimizeWordpress?: boolean;
    /** Suppress session score collection (suppress_session_score) */
    suppressSessionScore?: boolean;
    /** Enable or disable legacy Bot Fight Mode setting if applicable (fight_mode) */
    fightMode?: boolean;
}
/**
 * Super Bot Fight Mode Definitely plan configuration.
 * Maps to Cloudflare API: sbfm_definitely_automated, sbfm_verified_bots,
 * sbfm_static_resource_protection, optimize_wordpress, suppress_session_score, fight_mode
 */
export interface SuperBotFightModeDefinitelyConfiguration {
    /** Action for definitely automated traffic (sbfm_definitely_automated) */
    sbfmDefinitelyAutomated?: SbfmAction;
    /** Handling for verified bots (sbfm_verified_bots): "allow" or "challenge" */
    sbfmVerifiedBots?: "allow" | "challenge";
    /** Protect static resources from automated requests (sbfm_static_resource_protection) */
    sbfmStaticResourceProtection?: boolean;
    /** Optimize protections for WordPress (optimize_wordpress) */
    optimizeWordpress?: boolean;
    /** Suppress session score collection (suppress_session_score) */
    suppressSessionScore?: boolean;
    /** Enable or disable legacy Bot Fight Mode setting if applicable (fight_mode) */
    fightMode?: boolean;
}
/**
 * Bot Management for Enterprise subscription configuration.
 * Extends base Bot Fight Mode options, adds model auto-update control.
 * Maps to Cloudflare API: auto_update_model
 */
export interface SubscriptionConfiguration extends BotFightModeConfiguration {
    /** Automatically update Bot Management model (auto_update_model) */
    autoUpdateModel?: boolean;
}
/**
 * Helper function to update Bot Management configuration for a zone
 * Maps high-level options to Cloudflare API fields
 */
export declare function updateBotManagement(api: CloudflareApi, zoneId: string, botManagement: BotManagement | undefined, oldBotManagement: BotManagement | undefined): Promise<void>;
//# sourceMappingURL=zone-bot-management.d.ts.map