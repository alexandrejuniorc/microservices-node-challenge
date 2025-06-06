import "@opentelemetry/auto-instrumentations-node/register";

import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import { trace } from "@opentelemetry/api";

import { setTimeout } from "node:timers/promises";

import { z } from "zod";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { channels } from "../broker/channels/index.ts";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/index.ts";
import { randomUUID } from "node:crypto";
import { dispatchOrderCreated } from "../broker/messages/order-created.ts";
import { tracer } from "../tracer/tracer.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, { origin: "*" });

app.get("/health", () => {
  return "OK";
});

// Escalonamento horizontal

// Maq1
// Maq2

// Deploy: Blue-green deployment
app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;

    console.log("Creating an order with amount", amount);

    const orderId = randomUUID();

    await db.insert(schema.orders).values({
      id: randomUUID(),
      customerId: "6754f2be-19b9-4b0a-88a9-5a94c7f4cbf3",
      amount,
    });

    const span = tracer.startSpan("eu acho que aqui ta dando merda");

    span.setAttribute("teste", "Hello world");

    await setTimeout(2000);

    span.end();

    trace.getActiveSpan()?.setAttribute("order.id", orderId);

    dispatchOrderCreated({
      orderId,
      amount,
      customer: { id: "6754f2be-19b9-4b0a-88a9-5a94c7f4cbf3" },
    });

    return reply.status(201).send();
  }
);

app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
  console.log("[Orders] HTTP Server running!");
});
