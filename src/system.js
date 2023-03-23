/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as util from "./commons/util.js";

const stickyEvents = Object.freeze(new Set([
  "prepare",
  "ready",
  "steady",
  "go",
]));

const events = Object.freeze(new Set([
  "stop",
]));

const listeners = Object.freeze(new Map());
const waitGroup = Object.freeze(new Map());

for (const e of events) {
  listeners.set(e, new Set());
  waitGroup.set(e, new Set());
}

for (const se of stickyEvents) {
  listeners.set(se, new Set());
  waitGroup.set(se, new Set());
}

export async function pub(event, parcel = undefined) {
  awaiters(event, parcel);
  callbacks(event, parcel);
}

export function sub(event, cb) {
  const eventCallbacks = listeners.get(event);
  if (!eventCallbacks) {
    if (stickyEvents.has(event)) {
      util.microtaskBox(cb);
      return true;
    }
    return false;
  }
  eventCallbacks.add(cb);
  return true;
}

export function when(event, timeout = 0) {
  const wg = waitGroup.get(event);
  if (!wg) {
    if (stickyEvents.has(event)) {
      return Promise.resolve(event);
    }
    return Promise.reject(new Error(`${event} missing`));
  }
  return new Promise((accept, reject) => {
    const fulfiller = (parcel) => {
      accept(parcel, event);
    };
    wg.add(fulfiller);
    if (timeout > 0) {
      const tid = util.timeout(timeout, () => {
        wg.delete(fulfiller);
        reject(new Error(`${event} elapsed ${timeout}`));
      });
      wg.add(() => {
        clearTimeout(tid);
      });
    }
  });
}

function awaiters(event, parcel) {
  const g = waitGroup.get(event);
  if (!g) return;
  util.safeBox(g, Object.freeze(parcel));
}

function callbacks(event, parcel) {
  const cbs = listeners.get(event);
  if (!cbs) return;
  util.microtaskBox(cbs, Object.freeze(parcel));
}
