/*
 * Copyright (c) 2023 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const RATE_LIMIT_WINDOW_SIZE = 1000; // 1 second
const RATE_LIMIT_WINDOW_LIMIT = 30; // max amount of requests in 1 second

class RateLimiter {
  constructor() {
    this.window = {
      size: RATE_LIMIT_WINDOW_SIZE,
      limit: RATE_LIMIT_WINDOW_LIMIT,
      requests: [],
    };
    setInterval(() => {
      this.window.requests = this.window.requests.filter((timestamp) => {
        return Date.now() - timestamp < this.window.size;
      });
    }, this.window.size);
  }

  async middleware(request) {
    if (this.window.requests.length >= this.window.limit) {
      return new Response("Service Unavailable", {
        status: 503,
        headers: {
          "Retry-After": this.window.size / 1000,
        },
      });
    } else {
      this.window.requests.push(Date.now());
      return true;
    }
  }

  incrementToken() {
    // no-op, not needed for sliding window algorithm
  }
}

export default new RateLimiter();
