import crypto from 'node:crypto'

import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { database } from '../database'
import { checkSessionId } from '../middleware/check-session-id'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionId],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await database('transactions')
        .where('session_id', sessionId)
        .select()

      return {
        transactions,
      }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionId],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const getTransactionParametersSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParametersSchema.parse(request.params)

      const transaction = await database('transactions')
        .where({
          id,
          session_id: sessionId,
        })
        .first()

      if (!transaction) {
        return {
          message: 'Transaction not found',
        }
      }

      return {
        transaction,
      }
    },
  )

  app.get(
    '/balance',
    {
      preHandler: [checkSessionId],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const balance = await database('transactions')
        .where('session_id', sessionId)
        .sum('value', { as: 'value' })
        .first()

      return {
        balance,
      }
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      value: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, value, type } = createTransactionSchema.parse(request.body)

    let { sessionId } = request.cookies

    if (!sessionId) {
      sessionId = crypto.randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    await database('transactions').insert({
      id: crypto.randomUUID(),
      title,
      value: type === 'credit' ? value : value * -1,
      session_id: sessionId,
    })

    return reply.status(201).send('Transaction created')
  })
}
