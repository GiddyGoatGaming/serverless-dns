/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LfuCache } from "@serverless-dns/lfu-cache";

const cacheInstances = new WeakMap();

export class UserCache {
  constructor(size) {
    const name = "UserCache";
    const cache = new LfuCache(name, size);
    cacheInstances.set(this, cache);
    this.log = log.withTags(name);
  }

  get(key) {
    return cacheInstances.get(this).get(key);
  }

  put(key, val) {
    if (typeof key !== "string" || typeof val !== "object") {
      throw new Error("Invalid input: key must be a string and val must be an object");
    }

    try {
      cacheInstances.get(this).put(key, val);
    } catch (e) {
      this.log.e("put", key, val, e.stack);
    }
  }
}
