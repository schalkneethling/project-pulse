import { describe, it, expect } from "vitest";
import { linkify } from "./linkify";

describe("linkify", () => {
  it("returns plain text as a single text segment", () => {
    const result = linkify("no links here");
    expect(result).toEqual([{ type: "text", value: "no links here" }]);
  });

  it("converts an https URL into a link segment", () => {
    const result = linkify("check https://example.com for details");
    expect(result).toEqual([
      { type: "text", value: "check " },
      { type: "link", value: "https://example.com" },
      { type: "text", value: " for details" },
    ]);
  });

  it("converts an http URL into a link segment", () => {
    const result = linkify("see http://example.com/path");
    expect(result).toEqual([
      { type: "text", value: "see " },
      { type: "link", value: "http://example.com/path" },
    ]);
  });

  it("handles multiple URLs in one string", () => {
    const result = linkify("a https://one.com b https://two.com c");
    expect(result).toEqual([
      { type: "text", value: "a " },
      { type: "link", value: "https://one.com" },
      { type: "text", value: " b " },
      { type: "link", value: "https://two.com" },
      { type: "text", value: " c" },
    ]);
  });

  it("handles a URL at the start of the string", () => {
    const result = linkify("https://start.com is the link");
    expect(result).toEqual([
      { type: "link", value: "https://start.com" },
      { type: "text", value: " is the link" },
    ]);
  });

  it("handles URLs with paths, query strings, and fragments", () => {
    const result = linkify("link: https://example.com/path?q=1&b=2#section");
    expect(result).toEqual([
      { type: "text", value: "link: " },
      { type: "link", value: "https://example.com/path?q=1&b=2#section" },
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(linkify("")).toEqual([]);
  });

  it("does not match URLs without protocol", () => {
    const result = linkify("visit example.com today");
    expect(result).toEqual([{ type: "text", value: "visit example.com today" }]);
  });
});
