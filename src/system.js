/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as util from "./commons/util.js";

const events = new Map();

// Initialize events
for (const eventName of ["prepare", "ready", "steady", "go", "stop"]) {
  events.set(eventName, { sticky: eventName !== "stop", fired: false, listeners: new Set(), waitGroup: new Set() });
}

export function pub(event, parcel = undefined) {
  const eventData = events.get(event);
  if (!eventData) return;
  eventData.fired = true;
  awaiters(event, parcel);
  callbacks(event, parcel);
}

export function sub(event, cb) {
  const eventData = events.get(event);
  if (!eventData) return false;
  if (eventData.sticky && eventData.fired) {
    Promise.resolve().then(() => cb(parcel));
    return true;
  }
  eventData.listeners.add(cb);
  return true;
}

export function when(event, timeout = 0) {
  const eventData = events.get(event);
  if (!eventData) return Promise.reject(new Error(event + " missing"));
  if (eventData.sticky && eventData.fired) return Promise.resolve(event);

  return new Promise((accept, reject) => {
    const tid = timeout > 0 ? util.timeout(timeout, () => reject(new Error(event + " elapsed " + timeout))) : -2;
    const fulfiller = function (parcel) {
      if (tid >= 0) clearTimeout(tid);
      accept(parcel, event);
    };
    eventData.waitGroup.add(fulfiller);
  });
}

function awaiters(event, parcel) {
  const eventData = events.get(event);
  if (!eventData) return;
  eventData.waitGroup.forEach((fulfiller) => Promise.resolve().then(() => fulfiller(parcel)));
  if (eventData.sticky) eventData.waitGroup.clear();
}

function callbacks(event, parcel) {
  const eventData = events.get(event);
  if (!eventData) return;
  eventData.listeners.forEach((cb) => Promise.resolve().then(() => cb(parcel)));
  if (eventData.sticky) eventData.listeners.clear();
}
