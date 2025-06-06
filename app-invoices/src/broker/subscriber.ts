// Pub/Sub Pattern

import { orders } from "./channels/orders.ts";

orders.consume(
  "orders",
  async (message) => {
    if (!message) {
      return null;
    }

    console.log(message?.content.toString());

    orders.ack(message);
  },
  { noAck: false } // Acknowledge messages after processing
);
