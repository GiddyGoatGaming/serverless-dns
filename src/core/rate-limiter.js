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
    this.devices = {};
  }

  async middleware(request) {
    const ipAddress = request.headers.get("X-Forwarded-For");
    if (!ipAddress) {
      // Unable to determine IP address, treat as separate device
      return this._checkRequest(ipAddress);
    }
    if (!this.devices[ipAddress]) {
      this.devices[ipAddress] = [];
    }
    return this._checkRequest(ipAddress);
  }

  _checkRequest(ipAddress) {
    const now = Date.now();
    this.devices[ipAddress] = this.devices[ipAddress].filter((timestamp) => {
      return now - timestamp < RATE_LIMIT_WINDOW_SIZE;
    });
    if (this.devices[ipAddress].length >= RATE_LIMIT_WINDOW_LIMIT) {
      return new Response("Service Unavailable", {
        status: 503,
        headers: {
          "Retry-After": RATE_LIMIT_WINDOW_SIZE / 1000,
        },
      });
    } else {
      this.devices[ipAddress].push(now);
      return true;
    }
  }
}

export default new RateLimiter();
