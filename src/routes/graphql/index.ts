import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql } from 'graphql';
import { schema } from './schema.js';
import { ContextType } from './context.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req, reply) {
      try {
        const result = await graphql({
          schema,
          source: req.body.query,
          variableValues: req.body.variables,
          contextValue: { prisma } as ContextType,
        });

        if (result.errors) {
          return { errors: result.errors, prisma };
        }

        return result;
      } catch (error) {
        const message = (error as Error).message;
        return {
          errors: [{ message }],
        };
      }
    },
  });
};

export default plugin;
