import { notFound } from "./http";
import { GAME_TYPES } from "./models";

export function assertGameType(type) {
  if (!GAME_TYPES.includes(type)) throw notFound("Unknown game");
  return type;
}
