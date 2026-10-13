import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { melbourneDate, melbourneDayStartUtc } from "../src/lib/time.ts";

/** "Today" in the admin is the Melbourne day, not the server's UTC day. */
describe("Melbourne day boundaries", () => {
  test("9am Melbourne is still 'today' though it is yesterday in UTC", () => {
    // 2026-10-13 22:00 UTC = 2026-10-14 09:00 AEDT (UTC+11)
    const now = new Date("2026-10-13T22:00:00Z");
    assert.equal(melbourneDate(now), "2026-10-14");
    assert.equal(melbourneDayStartUtc(now), "2026-10-13 13:00:00");
  });

  test("standard time (UTC+10) in winter", () => {
    const now = new Date("2026-07-01T03:00:00Z");
    assert.equal(melbourneDayStartUtc(now), "2026-06-30 14:00:00");
  });

  test("the morning DST starts, midnight was still standard time", () => {
    // DST begins 2026-10-04 at 2am AEST. Midnight that day was UTC+10.
    const now = new Date("2026-10-04T05:00:00Z");
    assert.equal(melbourneDate(now), "2026-10-04");
    assert.equal(melbourneDayStartUtc(now), "2026-10-03 14:00:00");
  });
});
