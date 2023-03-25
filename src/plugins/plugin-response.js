/*
 * Copyright (c) 2022 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as util from "../commons/util.js";
import * as bufutil from "../commons/bufutil.js";

export class RResp {
  constructor(data = new RespData(), isException = false, exceptionFrom = "", exceptionStack = "") {
    this.data = data;
    this.isException = isException;
    this.exceptionFrom = exceptionFrom;
    this.exceptionStack = exceptionStack;
  }
}

export class RespData {
  constructor({ isBlocked = false, flag = "", dnsPacket = null, dnsBuffer = null, stamps = {} } = {}) {
    this.isBlocked = isBlocked;
    this.flag = flag;
    this.dnsPacket = dnsPacket;
    this.dnsBuffer = dnsBuffer;
    this.stamps = stamps;
  }
}

export function emptyResponse() {
  return new RResp();
}

export function errResponse(id, err = new Error()) {
  const st = err.stack || "no-stacktrace";
  return new RResp(null, true, id, st);
}

export function dnsResponse(packet, raw, stamps) {
  if (!packet || !ArrayBuffer.isView(raw)) {
    throw new Error("empty packet for dns-res");
  }
  return new RespData({ dnsPacket: packet, dnsBuffer: raw, stamps });
}

export function rdnsBlockResponse(flag) {
  if (!flag) {
    throw new Error("no flag set for block-res");
  }
  return new RespData({ isBlocked: true, flag });
}

export function rdnsNoBlockResponse() {
  return new RespData();
}

export function copyOnlyBlockProperties(to, from) {
  return Object.assign(to, { isBlocked: from.isBlocked, flag: from.flag });
}
