/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import RethinkPlugin from "./plugin.js";
import { respond204, timedSafeAsyncOp, fromBrowser } from "../commons/util.js";
import { requestTimeout } from "../commons/dnsutil.js";
import { errResponse } from "../plugins/plugin-response.js";
import IOState from "./io-state.js";

/**
 * @param {FetchEvent} event
 * @returns {Promise<Response>}
 */
export async function handleRequest(event) {
  if (optionsRequest(event.request)) return respond204();

  const io = new IOState();
  const ua = event.request.headers.get("User-Agent");
  try {
    const plugin = new RethinkPlugin(event);
    await plugin.initIoState(io);
    if (io.httpResponse) {
      return withCors(io, ua);
    }

    const primaryUrl = process.env.CF_DNS_RESOLVER_URL;
    const secondaryUrl = process.env.CF_DNS_RESOLVER_URL_2;

    const primaryResponse = await fetch(primaryUrl, {
      method: "POST",
      mode: "http3",
      body: await event.request.arrayBuffer()
    });
    if (primaryResponse.ok) {
      return primaryResponse;
    }

    const secondaryResponse = await fetch(secondaryUrl, {
      method: "POST",
      mode: "http3",
      body: await event.request.arrayBuffer()
    });
    if (secondaryResponse.ok) {
      return secondaryResponse;
    }

    errorResponse(io);
  } catch (err) {
    console.error("doh", "proxy-request error", err.stack);
    errorResponse(io, err);
  }

  return withCors(io, ua);
}

function optionsRequest(request) {
  return request.method === "OPTIONS";
}

function errorResponse(io, err = null) {
  const eres = errResponse("doh.js", err);
  io.dnsExceptionResponse(eres);
}

function withCors(io, ua) {
  if (fromBrowser(ua)) io.setCorsHeadersIfNeeded();
  return io.httpResponse;
}
