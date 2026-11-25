import { describe, it, expect } from "vitest";
import {
  AphelionKeypair,
  deriveAccounts,
  deriveKeypair,
  ENTROPY,
  generateEntropy,
  generateMnemonic,
  getWordlist,
  isValidPublicKey,
  isValidSecretKey,
  LANGUAGE,
  MAX_ACCOUNT_INDEX,
  mnemonicToSeed,
  splitMnemonicWords,
  validateMnemonic,
  zeroBytes,
} from "../src/index";

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// SEP-0005 Test Vector 3
const testVector3Mnemonic =
  "bench hurt jump file august wise shallow " +
  "faculty impulse spring exact slush thunder " +
  "author capable act festival slice deposit sauce " +
  "coconut afford frown better";
const testVector3SeedHex =
  "937ae91f6ab6f12461d9936dfc1375ea5312d097f3f1eb6fed6a82fb" +
  "e38c85824da8704389831482db0433e5f6c6c9700ff1946aa75ad8cc" +
  "2654d6e40f567866";
const testVector3PublicKeys = [
  "GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ",
  "GB3MTYFXPBZBUINVG72XR7AQ6P2I32CYSXWNRKJ2PV5H5C7EAM5YYISO",
  "GDYF7GIHS2TRGJ5WW4MZ4ELIUIBINRNYPPAWVQBPLAZXC2JRDI4DGAKU",
  "GAFLH7DGM3VXFVUID7JUKSGOYG52ZRAQPZHQASVCEQERYC5I4PPJUWBD",
  "GAXG3LWEXWCAWUABRO6SMAEUKJXLB5BBX6J2KMHFRIWKAMDJKCFGS3NN",
  "GA6RUD4DZ2NEMAQY4VZJ4C6K6VSEYEJITNSLUQKLCFHJ2JOGC5UCGCFQ",
  "GCUDW6ZF5SCGCMS3QUTELZ6LSAH6IVVXNRPRLAUNJ2XYLCA7KH7ZCVQS",
  "GBJ646Q524WGBN5X5NOAPIF5VQCR2WZCN6QZIDOSY6VA2PMHJ2X636G4",
  "GDHX4LU6YBSXGYTR7SX2P4ZYZSN24VXNJBVAFOB2GEBKNN3I54IYSRM4",
  "GDXOY6HXPIDT2QD352CH7VWX257PHVFR72COWQ74QE3TEV4PK2KCKZX7",
];
const testVector3SecretKeys = [
  "SAEWIVK3VLNEJ3WEJRZXQGDAS5NVG2BYSYDFRSH4GKVTS5RXNVED5AX7",
  "SBKSABCPDWXDFSZISAVJ5XKVIEWV4M5O3KBRRLSPY3COQI7ZP423FYB4",
  "SD5CCQAFRIPB3BWBHQYQ5SC66IB2AVMFNWWPBYGSUXVRZNCIRJ7IHESQ",
  "SBSGSAIKEF7JYQWQSGXKB4SRHNSKDXTEI33WZDRR6UHYQCQ5I6ZGZQPK",
  "SBIZH53PIRFTPI73JG7QYA3YAINOAT2XMNAUARB3QOWWVZVBAROHGXWM",
  "SCVM6ZNVRUOP4NMCMMKLTVBEMAF2THIOMHPYSSMPCD2ZU7VDPARQQ6OY",
  "SBSHUZQNC45IAIRSAHMWJEJ35RY7YNW6SMOEBZHTMMG64NKV7Y52ZEO2",
  "SC2QO2K2B4EBNBJMBZIKOYSHEX4EZAZNIF4UNLH63AQYV6BE7SMYWC6E",
  "SCGMC5AHAAVB3D4JXQPCORWW37T44XJZUNPEMLRW6DCOEARY3H5MAQST",
  "SCPA5OX4EYINOPAUEQCPY6TJMYICUS5M7TVXYKWXR3G5ZRAJXY3C37GF",
];

// SEP-0005 Test Vector 4 (with passphrase)
const testVector4Mnemonic =
  "cable spray genius state float twenty onion head street " +
  "palace net private method loan turn phrase state blanket " +
  "interest dry amazing dress blast tube";
const testVector4Passphrase = "p4ssphr4se";
const testVector4SeedHex =
  "d425d39998fb42ce4cf31425f0eaec2f0a68f47655ea030d6d26e702" +
  "00d8ff8bd4326b4bdf562ea8640a1501ae93ccd0fd7992116da5dfa2" +
  "4900e570a742a489";
const testVector4PublicKeys = [
  "GDAHPZ2NSYIIHZXM56Y36SBVTV5QKFIZGYMMBHOU53ETUSWTP62B63EQ",
  "GDY47CJARRHHL66JH3RJURDYXAMIQ5DMXZLP3TDAUJ6IN2GUOFX4OJOC",
  "GCLAQF5H5LGJ2A6ACOMNEHSWYDJ3VKVBUBHDWFGRBEPAVZ56L4D7JJID",
  "GBC36J4KG7ZSIQ5UOSJFQNUP4IBRN6LVUFAHQWT2ODEQ7Y3ASWC5ZN3B",
  "GA6NHA4KPH5LFYD6LZH35SIX3DU5CWU3GX6GCKPJPPTQCCQPP627E3CB",
  "GBOWMXTLABFNEWO34UJNSJJNVEF6ESLCNNS36S5SX46UZT2MNYJOLA5L",
  "GBL3F5JUZN3SQKZ7SL4XSXEJI2SNSVGO6WZWNJLG666WOJHNDDLEXTSZ",
  "GA5XPPWXL22HFFL5K5CE37CEPUHXYGSP3NNWGM6IK6K4C3EFHZFKSAND",
  "GDS5I7L7LWFUVSYVAOHXJET2565MGGHJ4VHGVJXIKVKNO5D4JWXIZ3XU",
  "GBOSMFQYKWFDHJWCMCZSMGUMWCZOM4KFMXXS64INDHVCJ2A2JAABCYRR",
];
const testVector4SecretKeys = [
  "SAFWTGXVS7ELMNCXELFWCFZOPMHUZ5LXNBGUVRCY3FHLFPXK4QPXYP2X",
  "SBQPDFUGLMWJYEYXFRM5TQX3AX2BR47WKI4FDS7EJQUSEUUVY72MZPJF",
  "SAF2LXRW6FOSVQNC4HHIIDURZL4SCGCG7UEGG23ZQG6Q2DKIGMPZV6BZ",
  "SDCCVBIYZDMXOR4VPC3IYMIPODNEDZCS44LDN7B5ZWECIE57N3BTV4GQ",
  "SA5TRXTO7BG2Z6QTQT3O2LC7A7DLZZ2RBTGUNCTG346PLVSSHXPNDVNT",
  "SDEOED2KPHV355YNOLLDLVQB7HDPQVIGKXCAJMA3HTM4325ZHFZSKKUC",
  "SDYNO6TLFNV3IM6THLNGUG5FII4ET2H7NH3KCT6OAHIUSHKR4XBEEI6A",
  "SDXMJXAY45W3WEFWMYEPLPIF4CXAD5ECQ37XKMGY5EKLM472SSRJXCYD",
  "SAIZA26BUP55TDCJ4U7I2MSQEAJDPDSZSBKBPWQTD5OQZQSJAGNN2IQB",
  "SDXDYPDNRMGOF25AWYYKPHFAD3M54IT7LCLG7RWTGR3TS32A4HTUXNOS",
];

describe("SEP-0005 Test Vector 3", () => {
  it("validates mnemonic and produces exact BIP39 seed", () => {
    expect(validateMnemonic(testVector3Mnemonic)).toBe(true);
    const seed = mnemonicToSeed(testVector3Mnemonic);
    expect(bytesToHex(seed)).toBe(testVector3SeedHex);
    zeroBytes(seed);
  });

  it("derives all 10 public and secret keys accurately", () => {
    const seed = mnemonicToSeed(testVector3Mnemonic);
    const accounts = deriveAccounts(seed, 0, 10);
    accounts.forEach((acc, i) => {
      expect(acc.index).toBe(i);
      expect(acc.path).toBe(`m/44'/148'/${i}'`);
      expect(acc.keypair.publicKey()).toBe(testVector3PublicKeys[i]);
      expect(acc.keypair.secret()).toBe(testVector3SecretKeys[i]);
      acc.keypair.destroy();
    });
    zeroBytes(seed);
  });
});

describe("SEP-0005 Test Vector 4 (with passphrase)", () => {
  it("validates mnemonic and produces exact BIP39 seed", () => {
    expect(validateMnemonic(testVector4Mnemonic)).toBe(true);
    const seed = mnemonicToSeed(testVector4Mnemonic, testVector4Passphrase);
    expect(bytesToHex(seed)).toBe(testVector4SeedHex);
    zeroBytes(seed);
  });

  it("derives all 10 public and secret keys accurately", () => {
    const seed = mnemonicToSeed(testVector4Mnemonic, testVector4Passphrase);
    const accounts = deriveAccounts(seed, 0, 10);
    accounts.forEach((acc, i) => {
      expect(acc.keypair.publicKey()).toBe(testVector4PublicKeys[i]);
      expect(acc.keypair.secret()).toBe(testVector4SecretKeys[i]);
      acc.keypair.destroy();
    });
    zeroBytes(seed);
  });
});

describe("BIP39 multilingual & entropy support", () => {
  it("generates and validates 12-word and 24-word mnemonics in all 8 languages", () => {
    for (const lang of Object.values(LANGUAGE)) {
      const m12 = generateMnemonic(lang, ENTROPY.BITS_128);
      const m24 = generateMnemonic(lang, ENTROPY.BITS_256);

      expect(splitMnemonicWords(m12)).toHaveLength(12);
      expect(splitMnemonicWords(m24)).toHaveLength(24);
      expect(validateMnemonic(m12, lang)).toBe(true);
      expect(validateMnemonic(m24, lang)).toBe(true);
      expect(getWordlist(lang)).toHaveLength(2048);
    }
  });

  it("normalizes Japanese ideographic spaces and ASCII spaces seamlessly", () => {
    const jp = generateMnemonic(LANGUAGE.JP, ENTROPY.BITS_256);
    const withIdeographic = splitMnemonicWords(jp).join("\u3000");
    const withAscii = splitMnemonicWords(jp).join(" ");
    expect(validateMnemonic(withIdeographic, LANGUAGE.JP)).toBe(true);
    expect(validateMnemonic(withAscii, LANGUAGE.JP)).toBe(true);
  });

  it("mixes user entropy with CSPRNG without throwing or degrading length", () => {
    const e128 = generateEntropy(ENTROPY.BITS_128, "123456-dice-rolls");
    const e256 = generateEntropy(ENTROPY.BITS_256, "random user text");
    expect(e128).toHaveLength(16);
    expect(e256).toHaveLength(32);
  });
});

describe("Security bounds & memory scrubbing", () => {
  it("rejects out-of-bounds and non-integer account indices", () => {
    const seed = mnemonicToSeed(testVector3Mnemonic);
    expect(() => deriveKeypair(seed, -1)).toThrow(RangeError);
    expect(() => deriveKeypair(seed, 1.5)).toThrow(RangeError);
    expect(() => deriveKeypair(seed, Number.NaN)).toThrow(RangeError);
    expect(() => deriveKeypair(seed, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => deriveKeypair(seed, MAX_ACCOUNT_INDEX + 1)).toThrow(RangeError);
    expect(() => deriveKeypair(seed, 2 ** 32)).toThrow(RangeError);

    // Max valid uint31 index should succeed
    const maxKp = deriveKeypair(seed, MAX_ACCOUNT_INDEX);
    expect(isValidPublicKey(maxKp.publicKey())).toBe(true);
    expect(isValidSecretKey(maxKp.secret())).toBe(true);
    maxKp.destroy();
    zeroBytes(seed);
  });

  it("rejects invalid seed lengths", () => {
    expect(() => deriveKeypair(new Uint8Array(0), 0)).toThrow(RangeError);
    expect(() => deriveKeypair(new Uint8Array(15), 0)).toThrow(RangeError);
    expect(() => deriveKeypair(new Uint8Array(65), 0)).toThrow(RangeError);
  });

  it("scrubs secret bytes on AphelionKeypair.destroy() and blocks later access", () => {
    const kp = AphelionKeypair.fromSecret(testVector3SecretKeys[0]!);
    expect(kp.publicKey()).toBe(testVector3PublicKeys[0]);
    expect(kp.isDestroyed).toBe(false);

    kp.destroy();
    expect(kp.isDestroyed).toBe(true);
    expect(() => kp.secret()).toThrow();
    expect(() => kp.rawSecretKey()).toThrow();
    // Public key remains safely readable
    expect(kp.publicKey()).toBe(testVector3PublicKeys[0]);
  });

  it("detects single-character tampering in StrKey checksums", () => {
    const pub = testVector3PublicKeys[0]!;
    const tampered = pub.slice(0, -1) + (pub.endsWith("Q") ? "R" : "Q");
    expect(isValidPublicKey(pub)).toBe(true);
    expect(isValidPublicKey(tampered)).toBe(false);
    expect(isValidSecretKey(pub)).toBe(false);
    expect(isValidSecretKey(testVector3SecretKeys[0]!)).toBe(true);
  });
});
