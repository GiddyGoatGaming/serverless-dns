/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import "./core/workers/config.js";
import { handleRequest } from "./core/doh.js";
import * as system from "./system.js";
import * as util from "./commons/util.js";

export default {
  async fetch(request, env, context) {
    return serveDoh(request, env, context);
  },
};

const serveDoh = async (request, env, ctx) => {
  system.pub("prepare", { env: env });

  const event = util.mkFetchEvent(
    request,
    null,
    ctx.waitUntil.bind(ctx),
    ctx.passThroughOnException.bind(ctx)
  );

  try {
    const goEvent = await system.when("go");
    const response = await handleRequest(event);
    return response;
  } catch (e) {
    console.error("server", "serveDoh err", e);
    return util.respond405();
  }
};
