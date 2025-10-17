import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

// const Values = dynamic(() => import("./values"));

export default async function Home() {
  const { env } = await getCloudflareContext({ async: true });
  const values = await env.KV.list();

  return (
    <div>
      <h1>KV Values</h1>
      <pre>{JSON.stringify(values, null, 2)}</pre>;
      <button onClick={putValue}>Put Value</button>
      <button onClick={deleteValue}>Delete Value</button>
    </div>
  );
}

const putValue = async () => {
  "use server";

  const { env } = await getCloudflareContext({ async: true });
  await env.KV.put(crypto.randomUUID(), "test");
  revalidatePath("/");
};

const deleteValue = async () => {
  "use server";

  const { env } = await getCloudflareContext({ async: true });
  const values = await env.KV.list();
  await Promise.all(values.keys.map((key) => env.KV.delete(key.name)));
  revalidatePath("/");
};
