import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { execSync } from 'node:child_process';

describe('Meals routes', (test) => {
  let cookies: any = null;

  beforeAll(async () => {
    execSync('npm run knex -- migrate:rollback --all');
    execSync('npm run knex -- migrate:latest');
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create 20 new meals', async () => {
    const meals = [
      {
        name: 'Prato feito da casa',
        description:
          'Arroz, feijão, filé de frango grelhado, salada, tomate e cebola',
        eaten_at: '2023-08-28T17:15:00',
        within_diet: true,
      },
      {
        name: 'Laranja',
        description:
          'Arroz, feijão, filé de frango grelhado, salada, tomate e cebola',
        eaten_at: '2023-05-30T12:02:00',
        within_diet: true,
      },
      {
        name: 'Hamburger',
        description: 'Pão de Hamburger com Queijo Mussarela, maionese, ketchup',
        eaten_at: '2023-01-15T16:00:00',
        within_diet: false,
      },
      {
        name: 'Salmão grelhado',
        description: 'Salmão grelhado com molho de limão',
        eaten_at: '2023-07-10T19:30:00',
        within_diet: true,
      },
      {
        name: 'Pizza',
        description: 'Pizza de Pepperoni com molho de tomate e queijo',
        eaten_at: '2023-04-05T20:45:00',
        within_diet: false,
      },
      {
        name: 'Salada de Frutas',
        description: 'Maçã, banana, laranja, kiwi, abacaxi',
        eaten_at: '2023-02-20T09:15:00',
        within_diet: true,
      },
      {
        name: 'Sushi',
        description: 'Variedade de sushi com wasabi e molho de soja',
        eaten_at: '2023-09-12T18:00:00',
        within_diet: true,
      },
      {
        name: 'Churrasco',
        description: 'Churrasco de carne bovina e linguiça com acompanhamentos',
        eaten_at: '2023-03-25T13:30:00',
        within_diet: false,
      },
      {
        name: 'Salada de Alface',
        description: 'Alface, cenoura, pepino e molho de iogurte',
        eaten_at: '2023-06-07T12:45:00',
        within_diet: true,
      },
      {
        name: 'Sorvete',
        description: 'Sorvete de creme com calda de chocolate',
        eaten_at: '2023-11-18T14:00:00',
        within_diet: false,
      },
      {
        name: 'Omelete',
        description: 'Omelete de queijo e presunto com cebola e tomate',
        eaten_at: '2023-10-03T08:20:00',
        within_diet: true,
      },
      {
        name: 'Frango Frito',
        description: 'Peitos de frango fritos com batatas',
        eaten_at: '2023-04-15T19:00:00',
        within_diet: false,
      },
      {
        name: 'Salada de Quinoa',
        description: 'Salada de quinoa com abacate e tomate',
        eaten_at: '2023-09-28T12:10:00',
        within_diet: true,
      },
      {
        name: 'Café da Manhã',
        description: 'Café preto, torradas com manteiga e geleia',
        eaten_at: '2023-02-02T07:30:00',
        within_diet: true,
      },
      {
        name: 'Bolo de Chocolate',
        description: 'Bolo de chocolate com cobertura de ganache',
        eaten_at: '2023-05-12T15:40:00',
        within_diet: false,
      },
      {
        name: 'Salada de Cenoura',
        description: 'Cenoura ralada com passas e molho de mostarda',
        eaten_at: '2023-08-02T12:00:00',
        within_diet: true,
      },
      {
        name: 'Sopa de Tomate',
        description: 'Sopa de tomate com croutons',
        eaten_at: '2023-06-23T19:15:00',
        within_diet: true,
      },
      {
        name: 'Peixe Grelhado',
        description: 'Filé de peixe grelhado com limão e ervas',
        eaten_at: '2023-07-29T20:00:00',
        within_diet: true,
      },
      {
        name: 'Macarrão com Queijo',
        description: 'Macarrão com queijo gratinado no forno',
        eaten_at: '2023-11-05T18:45:00',
        within_diet: false,
      },
      {
        name: 'Smoothie de Morango',
        description: 'Smoothie de morango com iogurte e banana',
        eaten_at: '2023-03-10T10:30:00',
        within_diet: true,
      },
    ];

    for (const i in meals) {
      if (cookies) {
        await request(app.server)
          .post('/meals')
          .set('Cookie', cookies)
          .send(meals[i]);
      } else {
        const createMealResponse = await request(app.server)
          .post('/meals')
          .send(meals[i]);
        cookies = createMealResponse.get('Set-Cookie');
      }
    }

    let createdMeals = [];
    if (cookies) {
      createdMeals = (
        await request(app.server).get('/meals').set('Cookie', cookies).send()
      ).body.meals;
    }

    expect(createdMeals.length).toBe(20);
  });

  it('should be able to show the summay, amount = 20, amount_within_diet = 13, amount_out_of_diet = 7, amout_best_sequence_within_diet = 10', async () => {
    let summary = null;
    if (cookies)
      summary = (
        await request(app.server)
          .get('/meals/summary')
          .set('Cookie', cookies)
          .send()
      ).body.summary;

    expect(
      summary != null &&
        summary.amount === 20 &&
        summary.amount_within_diet === 13 &&
        summary.amount_out_of_diet === 7 &&
        summary.amount_best_sequence_within_diet === 10,
    ).toBe(true);
  });

  it('should be able to update the name of the first meal', async () => {
    let createdMeals = [];
    let updatedMeal = null;

    if (cookies) {
      createdMeals = (
        await request(app.server).get('/meals').set('Cookie', cookies).send()
      ).body.meals;
      if (createdMeals) {
        updatedMeal = createdMeals[0];
        const id = updatedMeal.id;
        const newName = updatedMeal.name + ' (ALTERADO)';
        await request(app.server)
          .put(`/meals/${id}`)
          .set('Cookie', cookies)
          .send({
            name: newName,
          });

        updatedMeal = (
          await request(app.server)
            .get(`/meals/${id}`)
            .set('Cookie', cookies)
            .send()
        ).body.meal;

        expect(updatedMeal.name).toBe(newName);
      }
    }
  });

  it('should be able to delete the last meal', async () => {
    let createdMeals = [];
    if (cookies) {
      createdMeals = (
        await request(app.server).get('/meals').set('Cookie', cookies).send()
      ).body.meals;
      if (createdMeals) {
        const { id } = createdMeals[createdMeals.length - 1];
        await request(app.server)
          .delete(`/meals/${id}`)
          .set('Cookie', cookies)
          .send();
        createdMeals = (
          await request(app.server).get('/meals').set('Cookie', cookies).send()
        ).body.meals;
        expect(createdMeals.length).toBe(19);
      }
    }
  });
});
