/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import EnvManager from "../env.js";
import * as system from "../../system.js";
import Log from "../log.js";
import { services } from "../svc.js";

(async () => {
  await system.when("prepare").then(prepare);
  await system.when("steady").then(start);
})();

function prepare(args) {
  if (!args) throw new Error("are we on workers?");
  if (!args.env) throw new Error("workers cannot be setup with empty env");

  globalThis.wenv = args.env;

  if (!globalThis.envManager) {
    globalThis.envManager = new EnvManager();
  }

  const isProd = wenv.WORKER_ENV === "production";

  if (!globalThis.log) {
    globalThis.log = new Log({
      level: envManager.get("LOG_LEVEL"),
      levelize: isProd,
      withTimestamps: false,
    });
  }

  system.pub("ready", { env: args.env });
}

function start() {
  if (!services.ready) {
    log.e("services not yet ready, and we've got a sig-up?!");
    return;
  }

  system.pub("go");
}
