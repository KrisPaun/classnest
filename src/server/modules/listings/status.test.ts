import { describe, expect, it } from "vitest";
import {
  canChangeVisibility,
  canPublish,
  canReject,
  canTakeDown,
  statusAfterHostEdit,
  statusToVisibility,
  visibilityToStatus,
} from "./status";
import { LISTING_STATUSES, type ListingStatus } from "./types";

describe("listing status and visibility", () => {
  it("shows only hidden statuses as not visible", () => {
    expect(statusToVisibility("HIDDEN_TEMPORARY")).toBe("temporary");
    expect(statusToVisibility("HIDDEN_PERMANENT")).toBe("permanent");
    for (const status of ["DRAFT", "IN_REVIEW", "PUBLISHED", "REJECTED"] as ListingStatus[]) {
      expect(statusToVisibility(status)).toBe("active");
    }
  });

  it("hides a listing temporarily or permanently, from any status except taken down", () => {
    for (const status of LISTING_STATUSES.filter((s) => s !== "TAKEN_DOWN")) {
      expect(visibilityToStatus("temporary", status)).toBe("HIDDEN_TEMPORARY");
      expect(visibilityToStatus("permanent", status)).toBe("HIDDEN_PERMANENT");
    }
  });

  it("brings a hidden listing back to review, because publishing does not exist yet", () => {
    expect(visibilityToStatus("active", "HIDDEN_TEMPORARY")).toBe("IN_REVIEW");
    expect(visibilityToStatus("active", "HIDDEN_PERMANENT")).toBe("IN_REVIEW");
  });

  it("brings a hidden listing back to PUBLISHED when it was approved before", () => {
    expect(visibilityToStatus("active", "HIDDEN_TEMPORARY", true)).toBe("PUBLISHED");
    expect(visibilityToStatus("active", "HIDDEN_PERMANENT", true)).toBe("PUBLISHED");
  });

  it("lets a moderator publish from review, rejected or taken down, and reject only from review", () => {
    for (const status of LISTING_STATUSES) {
      expect(canPublish(status)).toBe(status === "IN_REVIEW" || status === "REJECTED" || status === "TAKEN_DOWN");
      expect(canReject(status)).toBe(status === "IN_REVIEW");
    }
  });

  it("lets a moderator take down only a published listing", () => {
    for (const status of LISTING_STATUSES) expect(canTakeDown(status)).toBe(status === "PUBLISHED");
  });

  it("does not let the host change a listing taken down by an admin", () => {
    for (const visibility of ["active", "temporary", "permanent"] as const) {
      for (const wasPublished of [true, false]) {
        expect(visibilityToStatus(visibility, "TAKEN_DOWN", wasPublished)).toBe("TAKEN_DOWN");
      }
    }
    expect(canChangeVisibility("TAKEN_DOWN")).toBe(false);
    for (const status of LISTING_STATUSES.filter((s) => s !== "TAKEN_DOWN")) {
      expect(canChangeVisibility(status)).toBe(true);
    }
  });

  it("sends a rejected listing back to review when the host edits it, and leaves other statuses alone", () => {
    expect(statusAfterHostEdit("REJECTED")).toBe("IN_REVIEW");
    for (const status of LISTING_STATUSES.filter((s) => s !== "REJECTED")) {
      expect(statusAfterHostEdit(status)).toBe(status);
    }
  });

  it("does not change a listing that is already visible", () => {
    for (const status of ["DRAFT", "IN_REVIEW", "PUBLISHED", "REJECTED", "TAKEN_DOWN"] as ListingStatus[]) {
      expect(visibilityToStatus("active", status)).toBe(status);
    }
  });
});
