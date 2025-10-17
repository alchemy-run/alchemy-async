import { bar } from "./dir/bar.js";
import { foo } from "./foo.js";

export default {
  async fetch() {
    return new Response(
      JSON.stringify({
        foo,
        bar,
      }),
    );
  },
};
