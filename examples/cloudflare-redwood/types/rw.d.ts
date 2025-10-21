import { AppContext } from "../src/worker.js";

declare module "rwsdk/worker" {
  export interface DefaultAppContext extends AppContext {}
  export interface RequestInfo<Params = any, AppContext = DefaultAppContext> {
    ctx: AppContext;
  }
}
