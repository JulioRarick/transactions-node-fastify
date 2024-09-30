import { execSync } from 'node:child_process'

import request from 'supertest'
import * as test from 'vitest'

import { app } from '../src/app'

test.describe('Transactions routes', () => {
  test.beforeAll(async () => {
    await app.ready()
  })

  test.afterAll(async () => {
    await app.close()
  })

  test.beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test.it('should be able to user create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        value: 7000,
        type: 'credit',
      })
      .expect(201)
  })

  test.it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        value: 7000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('set-cookie')

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies || '')
      .expect(200)

    test.expect(listTransactions.body.transactions).toEqual([
      test.expect.objectContaining({
        title: 'Salary',
        value: 7000,
      }),
    ])
  })

  test.it('should be able get specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        value: 7000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('set-cookie')

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies || '')
      .expect(200)

    const transactionId = listTransactions.body.transactions[0].id

    const getTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies || '')
      .expect(200)

    test.expect(getTransaction.body.transaction).toEqual(
      test.expect.objectContaining({
        title: 'Salary',
        value: 7000,
      }),
    )
  })

  test.it('should be able to get the balance', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Salary',
        value: 7000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('set-cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies || '')
      .send({
        title: 'Test Debit',
        value: 2000,
        type: 'debit',
      })

    const balanceResponse = await request(app.server)
      .get('/transactions/balance')
      .set('Cookie', cookies || '')
      .expect(200)

    test.expect(balanceResponse.body.balance).toEqual({
      value: 5000,
    })
  })
})
