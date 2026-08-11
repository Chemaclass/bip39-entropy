/* ── BIP-39 seed engine ─────────────────────────────────────────── */
// The page has to work from a file:// URL, where crypto.subtle is not exposed.
// SHA-256 is therefore implemented here rather than borrowed from the platform.
// Nothing in this file touches the network, storage, or the clock.
const SEED = (() => {

  /* ── sha-256 ──────────────────────────────────────────────────── */
  // First 32 bits of the fractional parts of the cube roots of the first
  // 64 primes, per FIPS 180-4 §4.2.2.
  const K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);

  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  function sha256(bytes){
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                               0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const len = bytes.length;
    const blocks = Math.ceil((len + 9) / 64);
    const m = new Uint8Array(blocks * 64);
    m.set(bytes);
    m[len] = 0x80;

    // Message length as a 64-bit big-endian bit count. Nothing here hashes
    // more than 32 bytes, so the high word is always zero, but write it.
    const dv = new DataView(m.buffer);
    dv.setUint32(m.length - 8, Math.floor(len / 0x20000000));
    dv.setUint32(m.length - 4, (len * 8) >>> 0);

    const w = new Uint32Array(64);
    for (let b = 0; b < blocks; b++){
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(b * 64 + i * 4);
      for (let i = 16; i < 64; i++){
        const x = w[i - 15], y = w[i - 2];
        const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = H[0], b1 = H[1], c = H[2], d = H[3];
      let e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++){
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const t2 = (S0 + ((a & b1) ^ (a & c) ^ (b1 & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b1; b1 = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b1) >>> 0;
      H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }

    const out = new Uint8Array(32), ov = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) ov.setUint32(i * 4, H[i]);
    return out;
  }

  /* ── bits and bytes ───────────────────────────────────────────── */
  const bytesToBits = bytes => Array.from(bytes, b => bin(b, 8)).join("");

  const bitsToBytes = bits => {
    if (!/^[01]*$/.test(bits)) throw new Error("bitsToBytes: not a bit string");
    if (bits.length % 8)
      throw new Error("bitsToBytes: " + bits.length + " bits is not a whole number of bytes");
    const out = new Uint8Array(bits.length / 8);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(bits.substr(i * 8, 8), 2);
    return out;
  };

  const bytesToHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");

  const hexToBytes = hex => {
    if (!/^([0-9a-fA-F]{2})*$/.test(hex)) throw new Error("hexToBytes: not an even-length hex string");
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  };

  /* ── BIP-39 ───────────────────────────────────────────────────── */
  // ENT is 128..256 bits in steps of 32; CS = ENT/32; (ENT+CS) is a multiple
  // of 11, which is what makes the word count come out whole.
  const ENT_BYTES = [16, 20, 24, 28, 32];

  const entropy = bytes => {
    if (!(bytes instanceof Uint8Array)) throw new Error("entropy must be a Uint8Array");
    if (!ENT_BYTES.includes(bytes.length))
      throw new Error("entropy is " + bytes.length + " bytes, must be one of " + ENT_BYTES.join(", "));
    return bytes;
  };

  const checksumBits = bytes =>
    bytesToBits(sha256(entropy(bytes))).slice(0, bytes.length / 4);

  const entropyToIndices = bytes => {
    const bits = bytesToBits(entropy(bytes)) + checksumBits(bytes);
    const idx = [];
    for (let i = 0; i < bits.length; i += 11) idx.push(parseInt(bits.substr(i, 11), 2));
    return idx;
  };

  const entropyToWords = bytes => entropyToIndices(bytes).map(i => WORDS[i]);

  const STRENGTHS = [
    { words:12, entBits:128, csBits:4, flips:128, diceRolls:64 },
    { words:24, entBits:256, csBits:8, flips:256, diceRolls:128 }
  ];

  /* ── coins and dice ───────────────────────────────────────────── */
  const coinBits = flips => flips.map((f, i) => {
    if (f !== 0 && f !== 1) throw new Error("coin " + (i + 1) + " is " + f + ", must be 0 or 1");
    return String(f);
  }).join("");

  // 1,2,3,4 map straight onto 00,01,10,11 and 5,6 are thrown away. Folding the
  // spare faces back in (mod 4, or 6→pair) would waste no rolls but skews the
  // distribution; this mapping is uniform and a person can verify it by hand.
  const diceBits = rolls => {
    let bits = "", used = 0, rejected = 0;
    rolls.forEach((r, i) => {
      if (!Number.isInteger(r) || r < 1 || r > 6)
        throw new Error("roll " + (i + 1) + " is " + r + ", must be 1..6");
      if (r <= 4){ bits += bin(r - 1, 2); used++; } else rejected++;
    });
    return { bits, used, rejected };
  };

  /* ── self test ────────────────────────────────────────────────── */
  // Test vectors only. The seed path never hashes text, so an ASCII-range
  // encoder is enough and avoids depending on TextEncoder.
  const ascii = s => Uint8Array.from(s, c => c.charCodeAt(0));

  const SHA_VECTORS = [
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"]
  ];

  // github.com/trezor/python-mnemonic vectors.json, English.
  const rep = (w, n) => new Array(n).fill(w).join(" ");
  const BIP39_VECTORS = [
    ["00000000000000000000000000000000",
     rep("abandon", 11) + " about"],
    ["7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f",
     "legal winner thank year wave sausage worth useful legal winner thank yellow"],
    ["80808080808080808080808080808080",
     "letter advice cage absurd amount doctor acoustic avoid letter advice cage above"],
    ["ffffffffffffffffffffffffffffffff",
     "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong"],
    ["0000000000000000000000000000000000000000000000000000000000000000",
     rep("abandon", 23) + " art"],
    ["ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
     rep("zoo", 23) + " vote"]
  ];

  // Seeded so the property test is the same run to run; Math.random would make
  // a failure unreproducible, which is the one thing a seed tool cannot afford.
  const xorshift32 = s => {
    let x = s >>> 0 || 1;
    return () => {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;  x >>>= 0;
      return x;
    };
  };

  const selfTest = () => {
    const failures = [];

    SHA_VECTORS.forEach(([text, want]) => {
      const got = bytesToHex(sha256(ascii(text)));
      if (got !== want) failures.push('sha256("' + text + '") = ' + got + ", want " + want);
    });

    BIP39_VECTORS.forEach(([hex, want]) => {
      let got;
      try { got = entropyToWords(hexToBytes(hex)).join(" "); }
      catch (e){ got = "threw " + e.message; }
      if (got !== want) failures.push("entropy " + hex + "\n  got  " + got + "\n  want " + want);
    });

    const rnd = xorshift32(0x9e3779b9);
    for (let n = 0; n < 200; n++){
      const e = new Uint8Array(16);
      for (let i = 0; i < 16; i++) e[i] = rnd() >>> 24;
      const idx = entropyToIndices(e);
      const where = "random case " + n + " (" + bytesToHex(e) + "): ";
      if (idx.length !== 12){ failures.push(where + idx.length + " indices, want 12"); continue; }
      if (idx.some(i => !Number.isInteger(i) || i < 0 || i > 2047)){
        failures.push(where + "index outside 0..2047"); continue;
      }
      const bits = idx.map(i => bin(i, 11)).join("");
      if (bits.slice(128) !== checksumBits(bitsToBytes(bits.slice(0, 128))))
        failures.push(where + "checksum does not re-derive");
    }

    return { pass: failures.length === 0, failures };
  };

  return { sha256, bytesToBits, bitsToBytes, bytesToHex, hexToBytes,
           checksumBits, entropyToIndices, entropyToWords,
           coinBits, diceBits, STRENGTHS, selfTest };
})();
