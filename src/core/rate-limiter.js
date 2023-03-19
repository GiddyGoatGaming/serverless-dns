/*
 * Copyright (c) 2023 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const RATE_LIMIT_CAPACITY = 300; // max amount of requests at once. Only used if over 30 requests a sec
const RATE_LIMIT_FILL_RATE = 30; // max amount of requests that can be processed a sec before going to RATE_LIMIT_CAPACITY

class RateLimiter {
  constructor() {
    this.bucket = {
      capacity: RATE_LIMIT_CAPACITY,
      tokens: RATE_LIMIT_CAPACITY,
    };
    setInterval(() => {
      if (this.bucket.tokens < this.bucket.capacity) {
        this.bucket.tokens += RATE_LIMIT_FILL_RATE;
      }
    }, 1000 / RATE_LIMIT_FILL_RATE);
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
