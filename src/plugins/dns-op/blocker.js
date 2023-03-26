/*
 * Copyright (c) 2021 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as pres from "../plugin-response.js";
import * as rdnsutil from "../rdns-util.js";
import * as dnsutil from "../../commons/dnsutil.js";

export class DnsBlocker {
  constructor() {
    this.log = log.withTags("DnsBlocker");
  }

  blockQuestion(rxid, req, blockInfo) {
    const dnsPacket = req.dnsPacket;
    const stamps = req.stamps;

    if (!stamps) {
      this.log.d(rxid, "q: no stamp");
      return req;
    }

    if (!rdnsutil.hasBlockstamp(blockInfo)) {
      this.log.d(rxid, "q: no user-set blockstamp");
      return req;
    }

    if (!dnsutil.isQueryBlockable(dnsPacket)) {
      this.log.d(rxid, "not a blockable dns-query");
      return req;
    }

    const domains = dnsutil.extractDomains(dnsPacket);
    const bres = this.block(domains, blockInfo, stamps);

    return pres.copyOnlyBlockProperties(req, bres);
  }

  blockAnswer(rxid, res, blockInfo) {
    const dnsPacket = res.dnsPacket;
    const stamps = res.stamps;

    // dnsPacket is null when cache only has metadata
    if (!stamps || !dnsutil.hasAnswers(dnsPacket)) {
      this.log.d(rxid, "ans: no stamp / dns-packet");
      return res;
    }

    if (!rdnsutil.hasBlockstamp(blockInfo)) {
      this.log.d(rxid, "ans: no user-set blockstamp");
      return res;
    }

    if (!dnsutil.isAnswerBlockable(dnsPacket)) {
      this.log.d(rxid, "ans not cloaked with cname/https/svcb");
      return res;
    }

    if (dnsutil.isAnswerQuad0(dnsPacket)) {
      this.log.d(rxid, "ans: already blocked");
      return res;
    }

    const deny = rdnsutil.shouldBlock(blockInfo);
    const isAns = dnsutil.isAnswer(dnsPacket);
    const response = pres.copyOnlyBlockProperties(res, rdnsutil.rdnsNoBlockResponse());
    const r = rdnsutil.doBlockQuery(deny, dnsPacket, response, stamps, isAns);

    if (deny) {
      // create block packets/buffers in dnsBlocker.js
      this.addCtx("blockflag", r.flag);
      io.dnsBlockResponse(r.flag);
    } else if (response.isException || !isAns) {
      // if not blocked, but then, no-ans or is-exception, then:
      this.loadException(rxid, response, io);
    } else {
      this.addCtx("responseBodyBuffer", r.dnsBuffer);
      this.addCtx("responseDecodedDnsPacket", r.dnsPacket);
      this.addCtx("blockflag", r.flag);
      io.dnsResponse(r.dnsBuffer, r.dnsPacket, r.flag);
    }
  }
