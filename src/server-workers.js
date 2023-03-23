/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { handleRequest } from "./core/doh.js";
import * as system from "./system.js";
import * as util from "./commons/util.js";
import "./core/workers/config.js";

export default {
  async fetch(request, env, context) {
    return await serveDoh(request, env, context);
  },
};

async function serveDoh(request, env, ctx) {
  try {
    system.pub("prepare", { env });
    const event = util.mkFetchEvent(
      request,
      null,
      util.promisify(ctx.waitUntil.bind(ctx)),
      util.promisify(ctx.passThroughOnException.bind(ctx))
    );
    const response = await system.when("go").then(() => handleRequest(event));
    return response;
  } catch (e) {
    console.error("server", "serveDoh err", e);
    return util.respond405();
  }
}
