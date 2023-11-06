import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { knex } from '../database';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reply) => {
    console.log(`[${request.method}] ${request.url}`);
  });

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const meals = await knex('meals').where('session_id', sessionId).select();

      return reply.code(200).send({ meals });
    },
  );

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const meal = await knex('meals')
        .where({ session_id: sessionId, id })
        .first();

      return reply.code(200).send({
        meal,
      });
    },
  );

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;
      const meals = await knex('meals')
        .where('session_id', sessionId)
        .orderBy('eaten_at', 'asc');

      let amount = 0;
      let amountWithinDiet = 0;
      let amountOutOfDiet = 0;
      let amountBestSequenceWithinDiet = 0;
      let currentSequenceWithinDiet = 0;

      meals.forEach((meal) => {
        amount++;

        if (meal.within_diet) {
          amountWithinDiet++;
          currentSequenceWithinDiet++;
          amountBestSequenceWithinDiet = currentSequenceWithinDiet;
        } else {
          amountOutOfDiet++;
          if (currentSequenceWithinDiet > amountBestSequenceWithinDiet) {
            amountBestSequenceWithinDiet = currentSequenceWithinDiet;
          }
          currentSequenceWithinDiet = 0;
        }
      });

      const summary = {
        amount,
        amount_within_diet: amountWithinDiet,
        amount_out_of_diet: amountOutOfDiet,
        amount_best_sequence_within_diet: amountBestSequenceWithinDiet,
      };

      return reply.code(200).send({
        summary,
      });
    },
  );

  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      eaten_at: z.string(),
      within_diet: z.boolean(),
    });

    const {
      name,
      description,
      eaten_at: eatenAt,
      within_diet: withinDiet,
    } = createMealBodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    const meal = await knex('meals').returning('*').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      description,
      eaten_at: eatenAt,
      within_diet: withinDiet,
    });

    return reply.status(201).send({ meal });
  });

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      const createMealBodySchema = z
        .object({
          name: z.string(),
          description: z.string(),
          eaten_at: z.string(),
          within_diet: z.boolean(),
        })
        .partial();

      const {
        name,
        description,
        eaten_at: eatenAt,
        within_diet: withinDiet,
      } = createMealBodySchema.parse(request.body);

      const { sessionId } = request.cookies;

      let updatedFields = {};

      if (name !== undefined) updatedFields.name = name;
      if (description !== undefined) updatedFields.description = description;
      if (eatenAt !== undefined) updatedFields.eaten_at = eatenAt;
      if (withinDiet !== undefined) updatedFields.within_diet = withinDiet;

      console.log(updatedFields);

      const meal = await knex('meals')
        .where({ session_id: sessionId, id })
        .update(updatedFields);

      return reply.status(200).send({ meal });
    },
  );

  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      await knex('meals').where({ session_id: sessionId, id }).del();

      return reply.status(204).send();
    },
  );
}
