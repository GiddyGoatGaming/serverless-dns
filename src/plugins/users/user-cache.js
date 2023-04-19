/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LfuCache } from "@serverless-dns/lfu-cache";

export class UserCache {
  constructor(size) {
    const name = "UserCache";
    this.cache = new LfuCache(name, size);
    this.log = log.withTags(name);
  }

get(key) {
  const cache = cacheInstances.get(this);
  return cache.has(key) ? cache[key] : undefined;
}

  put(key, val) {
    try {
      this.cache.put(key, val);
    } catch (e) {
      this.log.e("put", key, val, e.stack);
    }
  }
}
