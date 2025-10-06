import type {
  APIRoute,
  GetStaticPaths,
  InferGetStaticParamsType,
  InferGetStaticPropsType,
} from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths = (async () => {
  const docs = await getCollection("docs");
  return docs
    .filter((doc) => doc.id !== "index")
    .map((doc) => ({
      params: { route: doc.id },
      props: { entry: doc },
    }));
}) satisfies GetStaticPaths;

type Params = InferGetStaticParamsType<typeof getStaticPaths>;
type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props, Params> = async ({ props }) => {
  const { entry } = props;
  return new Response(`# ${entry.data.title}\n\n${entry.body}`, {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
};
