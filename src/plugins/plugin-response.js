/*
 * Copyright (c) 2022 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Import statements
import * as util from "../commons/util.js";
import * as bufutil from "../commons/bufutil.js";

// RResp class
export class RResp {
  constructor(data = new RespData(), isException = false, exceptionFrom = "", exceptionStack = "") {
    /** @type {RespData?} */
    this.data = data;
    /** @type {boolean} */
    this.isException = isException;
    /** @type {String} */
    this.exceptionFrom = exceptionFrom;
    /** @type {String} */
    this.exceptionStack = exceptionStack;
  }
}

// RespData class
export class RespData {
  constructor(isBlocked = false, flag = "", dnsPacket = null, dnsBuffer = null, stamps = {}) {
    /** @type {boolean} */
    this.isBlocked = isBlocked;
    /** @type {String} */
    this.flag = flag;
    /** @type {Object} */
    this.dnsPacket = dnsPacket;
    /** @type {ArrayBuffer} */
    this.dnsBuffer = dnsBuffer;
    /** @type {Object?} */
    this.stamps = stamps;
  }
}

/** @returns {RResp} */
export function emptyResponse() {
  return new RResp();
}

/**
 * @param {String} id
 * @param {Error} err
 * @returns {RResp}
 */
export function errResponse(id, err) {
  const data = null;
  const isException = true;
  const stackTrace = util.emptyObj(err) || !err.stack ? "no-stacktrace" : err.stack;
  return new RResp(data, isException, id, stackTrace);
}

export function dnsResponse(packet = null, raw = null, stamps = null) {
  if (util.emptyObj(packet) || bufutil.emptyBuf(raw)) {
    throw new Error("empty packet for dns-res");
  }
  const flags = "";
  const isBlocked = false;
  return new RespData(isBlocked, flags, packet, raw, stamps);
}

/**
 * @param {String} flag
 * @returns {RespData}
 */
export function rdnsBlockResponse(flag) {
  if (util.emptyString(flag)) {
    throw new Error("no flag set for block-res");
  }
  const isBlocked = true;
  return new RespData(isBlocked, flag);
}

/** @returns {RespData} */
export function rdnsNoBlockResponse() {
  return new RespData(false);
}

/**
 * Copy block related properties from one RespData to another
 * @param {RespData} to
 * @param {RespData} from
 * @returns {RespData} to
 */
export function copyOnlyBlockProperties(to, from) {
  to.isBlocked = from.isBlocked;
  to.flag = from.flag;
  return to;
}
