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
import { CancelSignal, loggedProcedure, t } from "../trpc.ts";

const createCloudflareGodToken = loggedProcedure
  .meta({
    description: "Create a Cloudflare god token with API key and account IDs",
  })
  .input(z.object({}))
  .mutation(async () => {
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

    const jsonBody = createJsonBody(accountIds);
    const apiToken = await fetch(
      "https://api.cloudflare.com/client/v4/user/tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Key": apiKey,
          "X-Auth-Email": accountEmail,
        },
        body: jsonBody,
      },
    )
      .then((res) => res.json())
      .then((data) => data.result.value)
      .catch((err) => {
        log.error(pc.red(`Error creating god token: ${err.message}`));
        throw new CancelSignal();
      });

    log.info(`God token created: ${pc.magenta(apiToken)}`);

    outro(pc.green("✅ God token data collected"));

    return {
      success: true,
      accountIdsCount: accountIds.length,
    };
  });

export const util = t.router({
  "create-cloudflare-god-token": createCloudflareGodToken,
});

function createJsonBody(accountIds: Array<string>) {
  return `{
  "name": "CF Write All",
  "status": "active",
  "issued_on": "2025-04-06T15:17:39Z",
  "modified_on": "2025-06-29T09:23:54Z",
  "last_used_on": "2025-07-04T11:01:20Z",
  "userResources": [
    {
      "effect": "allow",
      "mode": "all",
      "rowId": 314
    }
  ],
  "condition": {},
  "policies": [
    {
      "effect": "allow",
      "resources": {
        ${accountIds.map((id) => `"com.cloudflare.api.account.${id}": "*"`).join(",")}
      },
      "permission_groups": [
        {
          "id": "bdbcd690c763475a985e8641dddc09f7"
        },
        {
          "id": "d229766a2f7f4d299f20eaa8c9b1fde9"
        },
        {
          "id": "07f91e3e32b647ffae0178d884f23ee0"
        },
        {
          "id": "adc8fa2bc6124928a8b3314dc63a1235"
        },
        {
          "id": "3e4e20ee40b9475dae22201c468fdb70"
        },
        {
          "id": "a1a7389ba7e441dba95852e10970fcc3"
        },
        {
          "id": "7fb8d27511b34d02994d005b520b679f"
        },
        {
          "id": "120f843a9c074f399b830e542e5616b8"
        },
        {
          "id": "adddda876faa4a0590f1b23a038976e4"
        },
        {
          "id": "5b7aedd821a548b9bf5a2acabbce98c7"
        },
        {
          "id": "dfe525ec7b07472c827d8d009178b2ac"
        },
        {
          "id": "419ec42810af4659ade77716dbe47bc6"
        },
        {
          "id": "9bf884ba0de445dab37ea4a3e1a2c9f1"
        },
        {
          "id": "dc44f27f48ab405392a5f69fe822bd01"
        },
        {
          "id": "2e095cf436e2455fa62c9a9c2e18c478"
        },
        {
          "id": "e34111af393449539859485aa5ddd5bd"
        },
        {
          "id": "677767156f294485b497a8f103172e7d"
        },
        {
          "id": "a3567c13e074447fb101babac3463566"
        },
        {
          "id": "6c8a3737f07f46369c1ea1f22138daaf"
        },
        {
          "id": "0caa90c9b186447397c8b00358d34a76"
        },
        {
          "id": "bacc64e0f6c34fc0883a1223f938a104"
        },
        {
          "id": "366f57075ffc42689627bcf8242a1b6d"
        },
        {
          "id": "b711942448db4b0aace44d1312f9fdb0"
        },
        {
          "id": "6ffe7f4299db4d4cb54f64e0eb12a456"
        },
        {
          "id": "64156ba5be47441096c83c7fc17c488b"
        },
        {
          "id": "e2980d9241cf4939bbbd74fdc43b9651"
        },
        {
          "id": "a7030c9c98d544e092d8b099fabb1f06"
        },
        {
          "id": "5b5c774a5d174ca88d046c8889648b3f"
        },
        {
          "id": "037b9e348b3b42d4b46ea2fcb1cfb3e7"
        },
        {
          "id": "721b2f51fba74871bd361de65aeb7e03"
        },
        {
          "id": "26ce6c7d18a346528e7b905d5e269866"
        },
        {
          "id": "5e5d3e8efeec49f3afb67bafecbcd511"
        },
        {
          "id": "c3c847c5802d4ce3ba00e3e97b3c8555"
        },
        {
          "id": "2a400bcb29154daab509fe07e3facab0"
        },
        {
          "id": "d30c9ad8b5224e7cb8d41bcb4757effc"
        },
        {
          "id": "4e5fd8ac327b4a358e48c66fcbeb856d"
        },
        {
          "id": "7c81856725af47ce89a790d5fb36f362"
        },
        {
          "id": "92c8dcd551cc42a6a57a54e8f8d3f3e3"
        },
        {
          "id": "865ebd55bc6d4b109de6813eccfefd13"
        },
        {
          "id": "db37e5f1cb1a4e1aabaef8deaea43575"
        },
        {
          "id": "f3604047d46144d2a3e9cf4ac99d7f16"
        },
        {
          "id": "18555e39c5ba40d284dde87eda845a90"
        },
        {
          "id": "8a9d35a7c8504208ad5c3e8d58e6162d"
        },
        {
          "id": "09c77baecb6341a2b1ca2c62b658d290"
        },
        {
          "id": "4736c02a9f224c8196ae5b127beae78c"
        },
        {
          "id": "c6f6338ceae545d0b90daaa1fed855e6"
        },
        {
          "id": "09b2857d1c31407795e75e3fed8617a1"
        },
        {
          "id": "92209474242d459690e2cdb1985eaa6c"
        },
        {
          "id": "910b6ecca1c5411bb894e787362d1312"
        },
        {
          "id": "755c05aa014b4f9ab263aa80b8167bd8"
        },
        {
          "id": "e4589eb09e63436686cd64252a3aebeb"
        },
        {
          "id": "8d28297797f24fb8a0c332fe0866ec89"
        },
        {
          "id": "abe78e2276664f4db588c1f675a77486"
        },
        {
          "id": "8bd1dac84d3d43e7bfb43145f010a15c"
        },
        {
          "id": "7a4c3574054a4d0ba7c692893ba8bdd4"
        },
        {
          "id": "ae16e88bc7814753a1894c7ce187ab72"
        },
        {
          "id": "235eac9bb64942b49cb805cc851cb000"
        },
        {
          "id": "cde8c82463b6414ca06e46b9633f52a6"
        },
        {
          "id": "4ea7d6421801452dbf07cef853a5ef39"
        },
        {
          "id": "bf7481a1826f439697cb59a20b22293e"
        },
        {
          "id": "0bc09a3cd4b54605990df4e307f138e1"
        },
        {
          "id": "618ec6c64a3a42f8b08bdcb147ded4e4"
        },
        {
          "id": "d44ed14bcc4340b194d3824d60edad3f"
        },
        {
          "id": "56907406c3d548ed902070ec4df0e328"
        },
        {
          "id": "92b8234e99f64e05bbbc59e1dc0f76b6"
        },
        {
          "id": "05880cd1bdc24d8bae0be2136972816b"
        },
        {
          "id": "b89a480218d04ceb98b4fe57ca29dc1f"
        },
        {
          "id": "c07321b023e944ff818fec44d8203567"
        },
        {
          "id": "29d3afbfd4054af9accdd1118815ed05"
        },
        {
          "id": "2fc1072ee6b743828db668fcb3f9dee7"
        },
        {
          "id": "a1c0fec57cf94af79479a6d827fa518c"
        },
        {
          "id": "b05b28e839c54467a7d6cba5d3abb5a3"
        },
        {
          "id": "96163bd1b0784f62b3e44ed8c2ab1eb6"
        },
        {
          "id": "61ddc58f1da14f95b33b41213360cbeb"
        },
        {
          "id": "2edbf20661fd4661b0fe10e9e12f485c"
        },
        {
          "id": "2ae23e4939d54074b7d252d27ce75a77"
        },
        {
          "id": "b33f02c6f7284e05a6f20741c0bb0567"
        },
        {
          "id": "bfe0d8686a584fa680f4c53b5eb0de6d"
        },
        {
          "id": "f7f0eda5697f475c90846e879bab8666"
        },
        {
          "id": "e086da7e2179491d91ee5f35b3ca210a"
        },
        {
          "id": "d2a1802cc9a34e30852f8b33869b2f3c"
        },
        {
          "id": "a416acf9ef5a4af19fb11ed3b96b1fe6"
        },
        {
          "id": "da6d2d6f2ec8442eaadda60d13f42bca"
        },
        {
          "id": "714f9c13a5684c2885a793f5edb36f59"
        },
        {
          "id": "7cf72faf220841aabcfdfab81c43c4f6"
        },
        {
          "id": "c1fde68c7bcc44588cbb6ddbc16d6480"
        },
        {
          "id": "1e13c5124ca64b72b1969a67e8829049"
        }
      ]
    },
    {
      "effect": "allow",
      "resources": {
        "com.cloudflare.api.account.zone.*": "*"
      },
      "permission_groups": [
        {
          "id": "5af6a2f284144e95a89840408439adef"
        },
        {
          "id": "1ba6ab4cacdb454b913bbb93e1b8cb8c"
        },
        {
          "id": "c4df38be41c247b3b4b7702e76eadae0"
        },
        {
          "id": "eafd71286d0e4fdca404a7b4d203c5c9"
        },
        {
          "id": "685f9605fd4e44ec937b6a0db658e629"
        },
        {
          "id": "4bd3fb513a23494aa1341a7e1eb6e080"
        },
        {
          "id": "945315185a8f40518bf3e9e6d0bee126"
        },
        {
          "id": "2002629aaff0454085bf5a201ed70a72"
        },
        {
          "id": "dadeaf3abdf14126a77a35e0c92fc36e"
        },
        {
          "id": "2eee71c9364c4cacaf469e8370f09056"
        },
        {
          "id": "87065285ab38463481e72815eefd18c3"
        },
        {
          "id": "c9915d86fbff46af9dd945c0a882294b"
        },
        {
          "id": "9110d9dd749e464fb9f3961a2064efc5"
        },
        {
          "id": "c244ec076974430a88bda1cdd992d0d9"
        },
        {
          "id": "06f0526e6e464647bd61b63c54935235"
        },
        {
          "id": "74e1036f577a48528b78d2413b40538d"
        },
        {
          "id": "f0235726de25444a84f704b7c93afadf"
        },
        {
          "id": "9ff81cbbe65c400b97d92c3c1033cab6"
        },
        {
          "id": "a9dba34cf5814d4ab2007b4ada0045bd"
        },
        {
          "id": "cdeb15b336e640a2965df8c65052f1e0"
        },
        {
          "id": "79b3ec0d10ce4148a8f8bdc0cc5f97f2"
        },
        {
          "id": "a4308c6855c84eb2873e01b6cc85cbb3"
        },
        {
          "id": "0fd9d56bc2da43ad8ea22d610dd8cab1"
        },
        {
          "id": "5ea6da42edb34811a78d1b007557c0ca"
        },
        {
          "id": "0ac90a90249747bca6b047d97f0803e9"
        },
        {
          "id": "b88a3aa889474524bccea5cf18f122bf"
        },
        {
          "id": "89bb8c37d46042e98b84560eaaa6379f"
        },
        {
          "id": "3b94c49258ec4573b06d51d99b6416c0"
        },
        {
          "id": "fb6778dc191143babbfaa57993f1d275"
        },
        {
          "id": "e0dc25a0fbdf4286b1ea100e3256b0e3"
        },
        {
          "id": "24fc124dc8254e0db468e60bf410c800"
        },
        {
          "id": "959972745952452f8be2452be8cbb9f2"
        },
        {
          "id": "3030687196b94b638145a3953da2b699"
        },
        {
          "id": "e6d2666161e84845a636613608cee8d5"
        },
        {
          "id": "28f4b596e7d643029c524985477ae49a"
        },
        {
          "id": "c03055bc037c4ea9afb9a9f104b7b721"
        },
        {
          "id": "3e0b5820118e47f3922f7c989e673882"
        },
        {
          "id": "ed07f6c337da4195b4e72a1fb2c6bcae"
        },
        {
          "id": "6d7f2f5f5b1d4a0e9081fdc98d432fd1"
        },
        {
          "id": "43137f8d07884d3198dc0ee77ca6e79b"
        },
        {
          "id": "4755a26eedb94da69e1066d98aa820be"
        },
        {
          "id": "9c88f9c5bce24ce7af9a958ba9c504db"
        }
      ]
    }
  ]
}`;
}
