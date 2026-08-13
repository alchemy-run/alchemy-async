export type VercelEnvironment = "development" | "preview" | "production";

type UniqueTuples<
  T extends VercelEnvironment,
  Acc extends readonly VercelEnvironment[] = [],
> = Acc | { [K in T]: UniqueTuples<Exclude<T, K>, readonly [...Acc, K]> }[T];

export type VercelEnvironments = UniqueTuples<VercelEnvironment>;

export type VercelRegions =
  | "cpt1" // Cape Town, South Africa
  | "cle1" // Cleveland, USA
  | "dxb1" // Dubai, UAE
  | "dub1" // Dublin, Ireland
  | "fra1" // Frankfurt, Germany
  | "hkg1" // Hong Kong
  | "lhr1" // London, UK
  | "bom1" // Mumbai, India
  | "kix1" // Osaka, Japan
  | "cdg1" // Paris, France
  | "pdx1" // Portland, USA
  | "sfo1" // San Francisco, USA
  | "gru1" // São Paulo, Brazil
  | "icn1" // Seoul, South Korea
  | "sin1" // Singapore
  | "arn1" // Stockholm, Sweden
  | "syd1" // Sydney, Australia
  | "hnd1" // Tokyo, Japan
  | "iad1" // Washington, D.C., USA
  | (string & {}); // special rune to maintain auto-suggestions without closing the type to new regions or ones we missed

export type VercelFrameworks =
  | "blitzjs"
  | "nextjs"
  | "gatsby"
  | "remix"
  | "react-router"
  | "astro"
  | "hexo"
  | "eleventy"
  | "docusaurus-2"
  | "docusaurus"
  | "preact"
  | "solidstart-1"
  | "solidstart"
  | "dojo"
  | "ember"
  | "vue"
  | "scully"
  | "ionic-angular"
  | "angular"
  | "polymer"
  | "svelte"
  | "sveltekit"
  | "sveltekit-1"
  | "ionic-react"
  | "create-react-app"
  | "gridsome"
  | "umijs"
  | "sapper"
  | "saber"
  | "stencil"
  | "nuxtjs"
  | "redwoodjs"
  | "hugo"
  | "jekyll"
  | "brunch"
  | "middleman"
  | "zola"
  | "hydrogen"
  | "vite"
  | "vitepress"
  | "vuepress"
  | "parcel"
  | "fasthtml"
  | "sanity-v3"
  | "sanity"
  | "storybook"
  | (string & {});

export type VercelTeam = {
  id: string;
  slug: string;
  name: string;
};
