import type { SpeechStateExternalEvent } from "speechstate";

/**
 * Furhat events supported so far
 * @todo support more events :-)
 */
type FurhatEvent =
  | { type: "response.speak.start" }
  | { type: "response.speak.end" };

export type FurstateEvent =
  | SpeechStateExternalEvent
  | FurhatEvent
  | { type: "WS_CONNECTED" };
