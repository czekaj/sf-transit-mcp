import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBudgetedFetch } from "../src/budget.js";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("External network forbidden in tests");
    }),
  );
});

describe("numeric instance request budget", () => {
  it("allows 20 calls per minute across different URLs and rejects further calls before fetch", async () => {
    let time = 0;
    const upstream = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json({ fixture: true }));
    const fetcher = createBudgetedFetch(upstream, () => time);
    for (let index = 0; index < 20; index++)
      await fetcher(`http://localhost/fixture/${index}`);
    await expect(
      fetcher("http://localhost/another-user"),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(upstream).toHaveBeenCalledTimes(20);
    time = 60_000;
    await expect(
      fetcher("http://localhost/next-minute"),
    ).resolves.toBeInstanceOf(Response);
    expect(upstream).toHaveBeenCalledTimes(21);
  });

  it("enforces 600 calls across minutes and resets after a day", async () => {
    let time = 0;
    const upstream = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json({ fixture: true }));
    const fetcher = createBudgetedFetch(upstream, () => time);
    for (let minute = 0; minute < 30; minute++) {
      time = minute * 60_000;
      for (let index = 0; index < 20; index++)
        await fetcher("http://localhost/fixture");
    }
    time = 30 * 60_000;
    await expect(fetcher("http://localhost/daily-cap")).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    expect(upstream).toHaveBeenCalledTimes(600);
    time = 86_400_000;
    await expect(fetcher("http://localhost/next-day")).resolves.toBeInstanceOf(
      Response,
    );
    expect(upstream).toHaveBeenCalledTimes(601);
  });

  it("uses rolling minute windows rather than resetting a whole burst allowance", async () => {
    let time = 0;
    const upstream = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json({ fixture: true }));
    const fetcher = createBudgetedFetch(upstream, () => time);
    for (let index = 0; index < 19; index++)
      await fetcher("http://localhost/fixture");
    time = 59_999;
    await fetcher("http://localhost/fixture");
    time = 60_000;
    for (let index = 0; index < 19; index++)
      await fetcher("http://localhost/fixture");
    await expect(fetcher("http://localhost/fixture")).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    time = 119_999;
    await expect(fetcher("http://localhost/fixture")).resolves.toBeInstanceOf(
      Response,
    );
    expect(upstream).toHaveBeenCalledTimes(40);
  });

  it("retains a recent daily burst when the process crosses its first 24-hour boundary", async () => {
    let time = 0;
    const upstream = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json({ fixture: true }));
    const fetcher = createBudgetedFetch(upstream, () => time);
    const burstStart = 86_400_000 - 30 * 60_000;
    for (let minute = 0; minute < 30; minute++) {
      time = burstStart + minute * 60_000;
      for (let index = 0; index < 20; index++)
        await fetcher("http://localhost/fixture");
    }
    time = 86_400_000;
    await expect(fetcher("http://localhost/fixture")).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    expect(upstream).toHaveBeenCalledTimes(600);
    time = burstStart + 86_400_000;
    await expect(fetcher("http://localhost/fixture")).resolves.toBeInstanceOf(
      Response,
    );
  });

  it("counts failed upstream attempts toward the budget without leaking inputs in the budget error", async () => {
    const upstream = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("fixture failure"));
    const fetcher = createBudgetedFetch(upstream, () => 0);
    for (let index = 0; index < 20; index++)
      await expect(fetcher("http://localhost/private-input")).rejects.toThrow(
        "fixture failure",
      );
    await expect(fetcher("http://localhost/private-input")).rejects.not.toThrow(
      "private-input",
    );
    expect(upstream).toHaveBeenCalledTimes(20);
  });
});
