import {
  confirm,
  intro,
  isCancel,
  log,
  outro,
  password,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import z from "zod";
import { Profile, Provider } from "../../src/auth.ts";
import { CancelSignal, loggedProcedure, t } from "../trpc.ts";
import { promptForProfileName } from "./configure.ts";

const createCloudflareToken = loggedProcedure
  .meta({
    description: "Create a Cloudflare god token with API key and account IDs",
  })
  .input(
    z.object({
      profile: z
        .string()
        .optional()
        .meta({ alias: "p" })
        .describe("the profile to use to generate a token"),
      godToken: z
        .boolean()
        .optional()
        .describe("if a god token should be created"),
    }),
  )
  .mutation(async ({ input }) => {
    if (input.godToken) {
      await createCloudflareGodToken();
    } else {
      await createCloudflareProfileToken(input);
    }
  });

export const util = t.router({
  "create-cloudflare-token": createCloudflareToken,
});

async function createToken(
  keyName: string,
  accountIds: Array<string>,
  permissionGroupIds: Array<string> | undefined,
  credentials: { apiKey: string; accountEmail: string },
) {
  type PermissionGroup = {
    id: string;
    name: string;
    description: string;
    scopes: Array<string>;
  };

  const permissionGroups = await fetch(
    "https://api.cloudflare.com/client/v4/user/tokens/permission_groups",
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Key": credentials.apiKey,
        "X-Auth-Email": credentials.accountEmail,
      },
    },
  )
    .then((res) => res.json())
    .then((data) => data.result as Array<PermissionGroup>)
    .then((data) => {
      //* filter permissions and group by scope
      const groupedByScope = data.reduce(
        (acc, group) => {
          if (
            permissionGroupIds != null &&
            !permissionGroupIds.includes(group.id)
          ) {
            return acc;
          }
          const scope = group.scopes[0];
          if (!acc[scope]) {
            acc[scope] = [];
          }
          acc[scope].push(group);
          return acc;
        },
        {} as Record<string, Array<PermissionGroup>>,
      );
      return groupedByScope;
    })
    .catch((err) => {
      log.error(pc.red(`Error fetching permission groups: ${err.message}`));
      throw new CancelSignal();
    });

  const apiToken = await fetch(
    "https://api.cloudflare.com/client/v4/user/tokens",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Key": credentials.apiKey,
        "X-Auth-Email": credentials.accountEmail,
      },
      body: JSON.stringify({
        name: `Alchemy Token - ${keyName}`,
        status: "active",
        policies: [
          {
            effect: "allow",
            resources: accountIds.reduce((acc, id) => {
              acc[`com.cloudflare.api.account.${id}`] = "*";
              return acc;
            }, {}),
            permission_groups: permissionGroups[
              "com.cloudflare.api.account"
            ].map((group) => ({ id: group.id })),
          },
          {
            effect: "allow",
            resources: { "com.cloudflare.api.account.zone.*": "*" },
            permission_groups: permissionGroups[
              "com.cloudflare.api.account.zone"
            ].map((group) => ({ id: group.id })),
          },
        ],
      }),
    },
  )
    .then((res) => res.json())
    .then((data) => data.result.value)
    .catch((err) => {
      log.error(pc.red(`Error creating cloudflare token: ${err.message}`));
      throw new CancelSignal();
    });

  return apiToken;
}

async function createCloudflareGodToken() {
  intro(pc.cyan("🧪 Create Cloudflare God Token"));

  const apiKey = await password({
    message: "Enter Cloudflare API Key",
  });
  if (isCancel(apiKey)) {
    throw new CancelSignal();
  }

  const accountEmail = await text({
    message: "Enter account email",
    placeholder: "user@example.com",
  });
  if (isCancel(accountEmail)) {
    throw new CancelSignal();
  }

  const accountIds: string[] = [];
  log.info(
    pc.dim("Enter account IDs (press enter with empty value to finish)"),
  );

  while (true) {
    const accountId = await text({
      message: `Enter account ID ${accountIds.length > 0 ? "(or press enter to finish)" : ""}`,
      placeholder: accountIds.length === 0 ? "account-id" : "",
      defaultValue: "",
      validate: (value) => {
        if (!value?.trim() && accountIds.length === 0) {
          return "Please enter at least one account ID";
        }
      },
    });

    if (isCancel(accountId)) {
      throw new CancelSignal();
    }

    const trimmedId = (accountId || "").trim();

    if (!trimmedId && accountIds.length > 0) {
      log.info(pc.dim("Finishing input..."));
      break;
    }

    if (trimmedId) {
      accountIds.push(trimmedId);
      log.info(pc.dim(`Added account ID: ${trimmedId}`));
    }
  }

  log.error(
    pc.red(
      "🚨 If this token is leaked or compromised, it could result in:\n   • Complete account takeover\n   • Data breaches\n   • Service disruption\n   • Financial losses\n",
    ),
  );

  const confirmCreate = await confirm({
    message: "Do you understand the risks and want to proceed?",
    initialValue: false,
  });

  if (isCancel(confirmCreate) || !confirmCreate) {
    log.info(pc.dim("Token creation cancelled"));
    throw new CancelSignal();
  }

  const apiToken = await createToken("GOD-TOKEN", accountIds, undefined, {
    apiKey,
    accountEmail,
  }).catch((err) => {
    log.error(pc.red(`Error creating cloudflare god token: ${err.message}`));
    throw new CancelSignal();
  });

  outro(`Cloudflare god token created: ${pc.magenta(apiToken)}`);
}

async function createCloudflareProfileToken(input: { profile?: string }) {
  const name = await promptForProfileName(input);
  intro(pc.cyan(`🧪 Create Cloudflare Token for ${pc.bold(name)}`));

  const profile = await Profile.get(name);
  if (profile == null) {
    throw new Error(`Profile ${pc.bold(name)} not found`);
  }
  const { provider } = await Provider.getWithCredentials({
    profile: name,
    provider: "cloudflare",
  });

  if (provider.method !== "oauth") {
    throw new Error(
      `Profile ${pc.bold(name)} is not configured to use Cloudflare via OAuth`,
    );
  }

  if (provider.scopes == null) {
    throw new Error(
      `Profile ${pc.bold(name)} is not configured with any Cloudflare scopes`,
    );
  }

  const permissionGroupIds: Array<string> = [];
  for (const scope of provider.scopes) {
    const ids = CLOUDFLARE_OAUTH_SCOPES_TO_PERMISSION_GROUP_IDS[scope];
    if (ids != null) {
      permissionGroupIds.push(...ids);
    }
  }

  const apiKey = await password({
    message: "Enter Cloudflare API Key",
  });
  if (isCancel(apiKey)) {
    throw new CancelSignal();
  }

  const accountEmail = await text({
    message: "Enter account email",
    placeholder: "user@example.com",
  });
  if (isCancel(accountEmail)) {
    throw new CancelSignal();
  }

  const apiToken = await createToken(
    name,
    [provider.metadata.id],
    permissionGroupIds,
    { apiKey, accountEmail },
  );

  outro(
    `Cloudflare token created for profile ${pc.bold(name)}: ${pc.magenta(apiToken)}`,
  );
}

export const CLOUDFLARE_OAUTH_SCOPES_TO_PERMISSION_GROUP_IDS = {
  "access:read": [
    "eb258a38ea634c86a0c89da6b27cb6b6",
    "7ea222f6d5064cfa89ea366d7c1fee89",
    "08e61dabe81a422dab0dea6fdef1a98a",
    "0f4841f80adb4bada5a09493300e7f8d",
    "4f3196a5c95747b6ad82e34e1d0a694f",
    "26bc23f853634eb4bff59983b9064fde",
    "b8b7514ce5364cd8ac0455f3eb16eb5f",
    "de99c87e48d642ce8c985d027905b475",
    "91f7ce32fa614d73b7e1fc8f0e78582b",
    "99ff99e4e30247a99d3777a8c4c18541",
    "e985ca9351db460faebbe8681c48e560",
  ],
  "access:write": [
    "a1c0fec57cf94af79479a6d827fa518c",
    "d30c9ad8b5224e7cb8d41bcb4757effc",
    "bc783549a3a741aaa10556faf8b485bb",
    "6d23f290472f4e6fad5c4398c057c356",
    "bfe0d8686a584fa680f4c53b5eb0de6d",
    "7121a0c7e9ed46e3829f9cca2bb572aa",
    "29d3afbfd4054af9accdd1118815ed05",
    "2fc1072ee6b743828db668fcb3f9dee7",
    "4e5fd8ac327b4a358e48c66fcbeb856d",
    "1e13c5124ca64b72b1969a67e8829049",
    "959972745952452f8be2452be8cbb9f2",
    "6c9d1cfcfc6840a987d1b5bfb880a841",
    "6db4e222e21248ac96a3f4c2a81e3b41",
    "eb258a38ea634c86a0c89da6b27cb6b6",
    "7ea222f6d5064cfa89ea366d7c1fee89",
    "08e61dabe81a422dab0dea6fdef1a98a",
    "0f4841f80adb4bada5a09493300e7f8d",
    "4f3196a5c95747b6ad82e34e1d0a694f",
    "26bc23f853634eb4bff59983b9064fde",
    "b8b7514ce5364cd8ac0455f3eb16eb5f",
    "de99c87e48d642ce8c985d027905b475",
    "91f7ce32fa614d73b7e1fc8f0e78582b",
    "99ff99e4e30247a99d3777a8c4c18541",
    "e985ca9351db460faebbe8681c48e560",
  ],
  "account:read": ["c1fde68c7bcc44588cbb6ddbc16d6480"],
  "agw:read": ["05a2a65760a546439ed29762b163cece"],
  "agw:run": [
    "05a2a65760a546439ed29762b163cece",
    "5e5d3e8efeec49f3afb67bafecbcd511",
  ],
  "ai:read": ["a92d2450e05d4e7bb7d0a64968f83d11"],
  "ai:write": [
    "a92d2450e05d4e7bb7d0a64968f83d11",
    "bacc64e0f6c34fc0883a1223f938a104",
  ],
  "aiaudit:read": ["19637fbb73d242c0a92845d8db0b95b1"],
  "aiaudit:write": [
    "19637fbb73d242c0a92845d8db0b95b1",
    "1ba6ab4cacdb454b913bbb93e1b8cb8c",
  ],
  "aig:read": ["4dc8917b4b40457d88d3035d5dadb054"],
  "aig:write": [
    "4dc8917b4b40457d88d3035d5dadb054",
    "644535f4ed854494a59cb289d634b257",
    "6c8a3737f07f46369c1ea1f22138daaf",
  ],
  "auditlogs:read": ["b05b28e839c54467a7d6cba5d3abb5a3"],
  "browser:read": ["374b03fa229f4eb6b011bb1cd7f235ee"],
  "browser:write": [
    "374b03fa229f4eb6b011bb1cd7f235ee",
    "adddda876faa4a0590f1b23a038976e4",
  ],
  "cfone:read": [
    "1cd960c063a0448481343372c963d8c7",
    "c1968d31028d4239976ec3bc4750bbf6",
    "07cf1c1952a84b13b2cd542f3d2f29ab",
  ],
  "cfone:write": [
    "5b5c774a5d174ca88d046c8889648b3f",
    "037b9e348b3b42d4b46ea2fcb1cfb3e7",
    "a7030c9c98d544e092d8b099fabb1f06",
    "1cd960c063a0448481343372c963d8c7",
    "c1968d31028d4239976ec3bc4750bbf6",
    "07cf1c1952a84b13b2cd542f3d2f29ab",
  ],
  "cloudchamber:write": [
    "65ec50cbde3d4c838bbe7500024d5745",
    "26ce6c7d18a346528e7b905d5e269866",
  ],
  "constellation:write": [
    "eeffa4d16812430cb4a0ae9e7f46fc24",
    "7c81856725af47ce89a790d5fb36f362",
  ],
  "containers:write": [
    "cfd39eebc07c4e3ea849e4b3d2644637",
    "bdbcd690c763475a985e8641dddc09f7",
  ],
  "d1:write": [
    "192192df92ee43ac90f2aeeffce67e35",
    "09b2857d1c31407795e75e3fed8617a1",
  ],
  "dex:read": ["3b376e0aa52c41cbb6afc9cab945afa8"],
  "dex:write": [
    "3a1e1ef09dd34271bb44fc4c6a419952",
    "3b376e0aa52c41cbb6afc9cab945afa8",
    "92c8dcd551cc42a6a57a54e8f8d3f3e3",
  ],
  "dns_analytics:read": [], //??
  "dns_records:edit": [
    "82e64a83756745bbbb1c9c2701bf816b",
    "95d69e8d6d5144bfb0923667355d9f11",
    "5b7aedd821a548b9bf5a2acabbce98c7",
    "4755a26eedb94da69e1066d98aa820be",
  ],
  "dns_records:read": [
    "82e64a83756745bbbb1c9c2701bf816b",
    "95d69e8d6d5144bfb0923667355d9f11",
  ],
  "dns_settings:read": ["cfa964bcdafc4ab39704e7476154e41b"],
  "firstpartytags:write": [], //??
  "lb:edit": [
    "59059f0c977b44f8b1c18e0aaf91c369",
    "419ec42810af4659ade77716dbe47bc6",
    "6d7f2f5f5b1d4a0e9081fdc98d432fd1",
    "9d24387c6e8544e2bc4024a03991339f",
    "d2a1802cc9a34e30852f8b33869b2f3c",
  ],
  "lb:read": [
    "59059f0c977b44f8b1c18e0aaf91c369",
    "9d24387c6e8544e2bc4024a03991339f",
    "e9a975f628014f1d85b723993116f7d5",
  ],
  "logpush:read": [
    "6a315a56f18441e59ed03352369ae956",
    "c4a30cd58c5d42619c86a3c36c441e2d",
  ],
  "logpush:write": [
    "6a315a56f18441e59ed03352369ae956",
    "c4a30cd58c5d42619c86a3c36c441e2d",
    "96163bd1b0784f62b3e44ed8c2ab1eb6",
    "3e0b5820118e47f3922f7c989e673882",
  ],
  "notification:read": ["ce18edbdcebf465e9d6d1d2fc80ffd42"],
  "notification:write": [
    "ce18edbdcebf465e9d6d1d2fc80ffd42",
    "c3c847c5802d4ce3ba00e3e97b3c8555",
  ],
  "pages:read": ["e247aedd66bd41cc9193af0213416666"],
  "pages:write": [
    "e247aedd66bd41cc9193af0213416666",
    "8d28297797f24fb8a0c332fe0866ec89",
  ],
  "pipelines:read": ["14b9cf2f410f4c0c9a16bb10a81c0e0b"],
  "pipelines:setup": ["5606e7405dc542949d949d59993d321f"],
  "pipelines:write": [
    "14b9cf2f410f4c0c9a16bb10a81c0e0b",
    "5606e7405dc542949d949d59993d321f",
    "e34111af393449539859485aa5ddd5bd",
  ],
  "query_cache:write": [],
  "queues:write": [
    "84a7755d54c646ca87cd50682a34bf7c",
    "366f57075ffc42689627bcf8242a1b6d",
  ],
  "r2_catalog:write": [
    "45db74139a62490b9b60eb7c4f34994b",
    "d229766a2f7f4d299f20eaa8c9b1fde9",
    "f45430d92e2b4a6cb9f94f2594c141b8",
  ],
  "radar:read": ["dfe525ec7b07472c827d8d009178b2ac"],
  "rag:read": ["d7887c7a417e4cf2a69f1d01c1a1dc3b"],
  "rag:write": [
    "d7887c7a417e4cf2a69f1d01c1a1dc3b",
    "7fb8d27511b34d02994d005b520b679f",
    "234108c786084936a381bb19b7f4ea65",
  ],
  "secrets_store:read": ["5e33b7d77788455c9fdf18cbd38ee5a0"],
  "secrets_store:write": [
    "5e33b7d77788455c9fdf18cbd38ee5a0",
    "adc8fa2bc6124928a8b3314dc63a1235",
  ],
  "sso-connector:read": ["1d80f6f165ea47f2b55d4a393fd697de"],
  "sso-connector:write": [
    "1d80f6f165ea47f2b55d4a393fd697de",
    "901ca5e292584c6aa1b4cdb39248bb07",
  ],
  "ssl_certs:write": [
    "a7a233f9604845c787d4c8c39ac09c21",
    "db37e5f1cb1a4e1aabaef8deaea43575",
    "7b7216b327b04b8fbc8f524e1f9b7531",
    "c03055bc037c4ea9afb9a9f104b7b721",
  ],
  "teams:pii": [], //??
  "teams:read": [], //??
  "teams:secure_location": [], //??
  "teams:write": [], //??
  "url_scanner:read": ["5d613a610b294788a29572aaac2f254d"],
  "url_scanner:write": [
    "5d613a610b294788a29572aaac2f254d",
    "2a400bcb29154daab509fe07e3facab0",
  ],
  "user:read": [], //??
  "vectorize:write": [
    "1799edaae5db489294430e20d9b519e0",
    "64156ba5be47441096c83c7fc17c488b",
  ],
  "workers:write": [
    "2072033d694d415a936eaeb94e6405b8",
    "28f4b596e7d643029c524985477ae49a",
    "1a71c399035b4950a1bd1466bbe4f420",
    "e086da7e2179491d91ee5f35b3ca210a",
  ],
  "workers_builds:read": ["ad99c5ae555e45c4bef5bdf2678388ba"],
  "workers_builds:write": ["2e095cf436e2455fa62c9a9c2e18c478"],
  "workers_kv:write": [
    "8b47d2786a534c08a1f94ee8f9f599ef",
    "f7f0eda5697f475c90846e879bab8666",
  ],
  "workers_observability:read": ["66c1ed49f4ed46098b75696a6d4ee3c9"],
  "workers_observability:write": [
    "66c1ed49f4ed46098b75696a6d4ee3c9",
    "82c075da3f4647a2a03becd0fe240f8a",
  ],
  "workers_observability_telemetry:write": ["29c629fb7b5e4c408ca0f7b545724fcc"],
  "workers_routes:write": [], //??
  "workers_scripts:write": [], //??
  "workers_tail:read": ["05880cd1bdc24d8bae0be2136972816b"],
  "zone:read": [
    "c8fed203ed3043cba015a93ad1616f1f",
    "517b21aee92c4d89936c976ba6e4be55",
    "211a4c0feb3e43b3a2d41f1443a433e7",
    "1b1ea24cf0904d33903f0cc7e54e280f",
    "dbc512b354774852af2b5a5f4ba3d470",
  ],
  offline_access: [],
} as const;
