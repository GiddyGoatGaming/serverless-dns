/*
 * Copyright (c) 2022 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/* eslint-disabled */
// eslint, no import-assert: github.com/eslint/eslint/discussions/15305
import u6cfg from "../u6-basicconfig.json" assert { type: 'json' };
import u6filetag from "../u6-filetag.json" assert { type: 'json' };

export const timestamp = () => u6cfg.timestamp;

export const tdNodeCount = () => u6cfg.nodecount;

export const tdParts = () => u6cfg.tdparts;

export const tdCodec6 = () => u6cfg.useCodec6;

export const orig = () => u6cfg;

export const filetag = () => u6filetag;

export const tdmd5 = () => u6cfg.tdmd5;

export const rdmd5 = () => u6cfg.rdmd5;
