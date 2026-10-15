import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  FEATURED_HOMES,
  cleanSuburbParam,
  publishableFeaturedHomes,
  type FeaturedHome,
} from "../src/lib/content/home-landing.ts";

/**
 * Builder homes on the public landing page: photo and suburb only, and only
 * with the builder's approval on record.
 */
const OK: FeaturedHome = {
  suburb: "Tarneit",
  photo: "/homes/tarneit-1.jpg",
  approvedBy: "Jane Citizen, Example Builder",
  approvalRef: "Email 15/10/2026",
};

describe("featured builder homes", () => {
  test("an approved suburb-only entry is shown", () => {
    assert.equal(publishableFeaturedHomes([OK], "2026-10-15").length, 1);
  });

  test("no recorded approval, no card", () => {
    assert.equal(publishableFeaturedHomes([{ ...OK, approvedBy: "" }], "2026-10-15").length, 0);
    assert.equal(publishableFeaturedHomes([{ ...OK, approvalRef: " " }], "2026-10-15").length, 0);
  });

  test("anything that looks like an address is refused", () => {
    for (const suburb of ["12 Smith St, Tarneit", "Lot 4 Tarneit", "Tarneit 3029"]) {
      assert.equal(publishableFeaturedHomes([{ ...OK, suburb }], "2026-10-15").length, 0, suburb);
    }
  });

  test("a lapsed approval takes the card down (the expiry day itself still shows)", () => {
    assert.equal(publishableFeaturedHomes([{ ...OK, approvalExpires: "2026-10-15" }], "2026-10-15").length, 1);
    assert.equal(publishableFeaturedHomes([{ ...OK, approvalExpires: "2026-10-14" }], "2026-10-15").length, 0);
  });

  test("the shipped list itself carries no address-like suburb and no extra fields", () => {
    const allowed = new Set(["suburb", "photo", "approvedBy", "approvalRef", "approvalExpires"]);
    for (const home of FEATURED_HOMES) {
      assert.doesNotMatch(home.suburb, /\d/, `${home.suburb} looks like an address`);
      for (const key of Object.keys(home)) assert.ok(allowed.has(key), `unexpected field "${key}"`);
    }
  });

  test("a suburb passed in a link is cleaned before it reaches the form", () => {
    assert.equal(cleanSuburbParam("Point Cook"), "Point Cook");
    assert.equal(cleanSuburbParam("<script>"), "");
    assert.equal(cleanSuburbParam("12 Smith St"), "");
    assert.equal(cleanSuburbParam(null), "");
  });
});
