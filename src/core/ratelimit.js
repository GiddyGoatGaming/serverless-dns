/*
 * Copyright (c) 2023 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// rate-limiter.js

const TOKEN_BUCKET_CAPACITY = 300;
const TOKEN_FILL_RATE = 30; // tokens per second

class RateLimiter {
  constructor() {
    this.bucket = {
      capacity: TOKEN_BUCKET_CAPACITY,
      tokens: TOKEN_BUCKET_CAPACITY,
    };
    setInterval(() => {
      if (this.bucket.tokens < this.bucket.capacity) {
        this.bucket.tokens += TOKEN_FILL_RATE;
      }
    }, 1000 / TOKEN_FILL_RATE);
  }

  async middleware(request) {
    if (this.bucket.tokens >= 1) {
      this.bucket.tokens--;
      return true;
    } else {
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": 60,
        },
      });
    }
  }

  incrementToken() {
    this.bucket.tokens++;
  }
}

export default new RateLimiter();

// doh.js

import RethinkPlugin from "./plugin.js";
import * as pres from "../plugins/plugin-response.js";
import * as util from "../commons/util.js";
import * as dnsutil from "../commons/dnsutil.js";
import IOState from "./io-state.js";
import rateLimiter from "./rate-limiter.js";

/**
 * @param {FetchEvent} event
 * @returns {Promise<Response>}
 */
export function handleRequest(event) {
  return proxyRequest(event);
}

/**
 * @param {FetchEvent} event
 * @returns {Promise<Response>}
 */
async function proxyRequest(event) {
  if (optionsRequest(event.request)) return util.respond204();

  const io = new IOState();
  const ua = event.request.headers.get("User-Agent");

  try {
    await rateLimiter.middleware(event.request);
    const plugin = new RethinkPlugin(event);
    await plugin.initIoState(io);

    // if an early response has been set by plugin.initIoState, return it
    if (io.httpResponse) {
      return withCors(io, ua);
    }

    await util.timedSafeAsyncOp(
      /* op*/ async () => plugin.execute(),
      /* waitMs*/ dnsutil.requestTimeout(),
      /* onTimeout*/ async () => errorResponse(io)
    );
  } catch (err) {
    log.e("doh", "proxy-request error", err.stack);
    errorResponse(io, err);
  }

  rateLimiter.incrementToken();
  return withCors(io, ua);
}
