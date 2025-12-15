declare namespace App {
  type StarlightLocals = import("@astrojs/starlight").StarlightLocals;
  // Define the `locals.t` object in the context of a plugin.
  interface Locals extends StarlightLocals {}
}
