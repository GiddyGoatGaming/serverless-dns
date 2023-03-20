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
  // workers/runtime-apis/fetch-event#syntax-module-worker
  async fetch(request, env, context) {
    return await serveDoh(request, env, context);
  },
};

/**
 * This function serves the DNS-over-HTTPS (DoH) request.
 * @param {Request} request The incoming HTTP request.
 * @param {Object} env The environment variables.
 * @param {Object} ctx The Cloudflare worker context.
 * @returns {Promise<Response>} A Promise that resolves to a Response object.
 */
async function serveDoh(request, env, ctx) {
  // Publish system prepare from here instead of from main which
  // runs in global scope.
  system.pub("prepare", { env });

  const event = util.mkFetchEvent(request, null, ctx.waitUntil, ctx.passThroughOnException);

  try {
    await system.when("go");
    const response = await handleRequest(event);
    return response;
  } catch (e) {
    console.error("server", "serveDoh err", e);
    return util.respond405();
  }
}
