// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2021 Linus Unnebäck
// from github.com/LinusU/base32-encode/blob/b970e2ee5/index.js
// and github.com/LinusU/base32-decode/blob/fa61c01b/index.js
// and github.com/LinusU/to-data-view/blob/e80ca034/index.js

const ALPHA32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const RALPHA32 = new Uint8Array(256); // Use Uint8Array instead of object for faster lookups
for (let i = 0; i < ALPHA32.length; i++) {
  RALPHA32[ALPHA32.charCodeAt(i)] = i;
}

function toDataView(data) {
  if (
    data instanceof Int8Array ||
    data instanceof Uint8Array ||
    data instanceof Uint8ClampedArray
  ) {
    return new DataView(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof ArrayBuffer) {
    return new DataView(data);
  }
  return null;
}

function readChar(chr) {
  const idx = RALPHA32[chr.charCodeAt(0)]; // Use charCodeAt for faster lookups
  if (idx === undefined) {
    throw new Error("invalid b32 character: " + chr);
  }
  return idx;
}

function base32(arrbuf, padding) {
  const view = toDataView(arrbuf);
  if (!view) throw new Error("cannot create data-view from given input");

  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < view.byteLength; i++) {
    value = (value << 8) | view.getUint8(i);
    bits += 8;

    while (bits >= 5) {
      output += ALPHA32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += ALPHA32[(value << (5 - bits)) & 31];
  }

  if (padding) {
    while (output.length % 8 !== 0) {
      output += "=";
    }
  }

  return output;
}

export function rbase32(input) {
  input = input.replace(/=+$/, "");

  const length = input.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(((length * 5) / 8) | 0);

  for (let i = 0; i < length; i++) {
    valuevalue << 5) | readChar(input[i]);
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output;
}
