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
