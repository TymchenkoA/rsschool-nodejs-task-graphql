import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, validate, parse } from 'graphql';
import depthLimit from 'graphql-depth-limit';
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
        const source = req.body.query;
        const documentAST = parse(source);

        const maxDepth = 5;
        const validationErrors = validate(schema, documentAST, [depthLimit(maxDepth)]);

        if (validationErrors.length > 0) {
          return reply.status(400).send({
            errors: validationErrors.map((error) => ({ message: error.message })),
          });
        }
        
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
