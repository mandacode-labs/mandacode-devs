import { ulid } from "ulid";

export function generateEntityId(): string {
  return ulid().toLowerCase();
}
