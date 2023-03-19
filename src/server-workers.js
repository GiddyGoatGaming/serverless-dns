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
    return await handleDohRequest(request, env, context);
  },
};

async function handleDohRequest(request, env, context) {
  system.publish("prepare", { env });

  const fetchEvent = util.mkFetchEvent(
    request,
    null,
    context.waitUntil.bind(context),
    context.passThroughOnException.bind(context)
  );

  try {
    await system.when("go");
    const response = await handleRequest(fetchEvent);
    return response;
  } catch (error) {
    console.error("server", "handleDohRequest error", error);
    return util.respond405();
  }
}
