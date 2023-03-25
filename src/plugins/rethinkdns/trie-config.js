/*
 * Copyright (c) 2022 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// github.com/serverless-dns/trie/blob/49049a87/src/config.js#L22
const defaults = {
  inspect: false,
  debug: false,
  useCodec6: false,
  optflags: false,
};

export function withDefaults(cfg) {
  return { ...defaults, ...cfg };
}
