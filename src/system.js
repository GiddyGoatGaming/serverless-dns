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

const listeners = Object.freeze(new Map(
  [...events, ...stickyEvents].map((event) => [event, new Set()])
));

const waitGroup = Object.freeze(new Map(
  [...events, ...stickyEvents].map((event) => [event, new Set()])
));

function pub(event, parcel = undefined) {
  awaiters(event, parcel);
  callbacks(event, parcel);
}

function sub(event, cb) {
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

function when(event, timeout = 0) {
  const wg = waitGroup.get(event);
  if (!wg) {
    if (stickyEvents.has(event)) {
      return Promise.resolve(event);
   .reject(new Error(`${event} missing`));
  }
  return new Promise((accept, reject) => {
    const tid = timeout > 0
      ? util.timeout(timeout, () => {
          reject(new Error(`${event} elapsed ${timeout}`));
        })
      : -2;
    const fulfiller = function (parcel) {
      if (tid >= 0) clearTimeout(tid);
      accept(parcel, event);
    };
    wg.add(fulfiller);
    Promise.race([
      new Promise((_, reject) => {
        if (timeout > 0) {
          util.timeout(timeout, () => {
            reject(new Error(`${event} elapsed ${timeout}`));
          });
        }
      }),
      new Promise((resolve) => {
        const cleanup = () => {
          wg.delete(fulfiller);
          if (wg.size === 0) {
            waitGroup.delete(event);
          }
        };
        fulfiller.cleanup = cleanup;
        fulfiller.resolve = resolve;
      }),
    ]).finally(() => {
      cleanup();
    });
  });
}

function awaiters(event, parcel) {
  const g = waitGroup.get(event);
  if (!g) return;
  if (stickyEvents.has(event)) {
    waitGroup.delete(event);
  }
  util.safeBox(g, parcel);
}

function callbacks(event, parcel) {
  const cbs = listeners.get(event);
  if (!cbs) return;
  if (stickyEvents.has(event)) {
    listeners.delete(event);
  }
  util.microtaskBox(cbs, parcel);
}

export { pub, sub, when };
