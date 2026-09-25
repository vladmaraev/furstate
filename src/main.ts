import { setup, fromCallback, sendTo, sendParent } from "xstate";
import type { SpeechStateExternalEvent } from "speechstate";
import { FurstateEvent } from "./types";

const callbackLogic = fromCallback(({ sendBack, receive }) => {
  const ws = new WebSocket("ws://127.0.0.1:9000/v1/events");

  receive((event: SpeechStateExternalEvent) => {
    console.log("Event received in the callback", event);
    switch (event.type) {
      case "SPEAK":
        ws.send(
          JSON.stringify({
            type: "request.speak.text",
            text: event.value.utterance,
          }),
        );
    }
  });

  ws.addEventListener("open", (event) => {
    console.log("Connection opened.", event);
    sendBack({ type: "WS_CONNECTED" });
  });

  ws.addEventListener("message", (event) => {
    const ev = JSON.parse(event.data);
    console.log("Message from server ", ev);
    sendBack(ev);
  });

  return () => {
    console.log("Connection closed.");
    ws.close();
  };
});

const furstate = setup({
  actors: { fhCallback: callbackLogic },
  types: { events: {} as FurstateEvent },
}).createMachine({
  id: "furstate",
  initial: "Start",
  states: {
    Start: {
      invoke: { id: "furhat", src: "fhCallback" },
      initial: "Connecting",
      states: {
        Connecting: {
          on: {
            WS_CONNECTED: {
              target: "Connected",
              actions: sendParent({ type: "WS_CONNECTED" }),
            },
          },
        },
        Connected: {
          on: {
            SPEAK: {
              actions: sendTo("furhat", ({ event }) => event),
            },
            "response.speak.start": {
              actions: [sendParent({ type: "TTS_STARTED" })],
            },
            "response.speak.end": {
              actions: [sendParent({ type: "SPEAK_COMPLETE" })],
            },
          },
        },
      },
    },
  },
});

export { furstate };
