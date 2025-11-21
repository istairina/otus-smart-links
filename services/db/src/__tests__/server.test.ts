import request from 'supertest';
import express from 'express';
import { db } from '../data/action';
import { app } from '../server';

describe('DB Service API', () => {
  let testApp: express.Application;

  beforeEach(() => {
    testApp = app;
    const rules = [...db.getRules()];
    rules.forEach(rule => {
      db.deleteRule(rule.id);
    });
    db.putRule({
      conditions: [
        { type: 'time', start: '09:00', end: '12:00' },
          { type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      ],
      action: { redirectTo: 'https://test.com' }
    });
  });

  describe('GET /rules', () => {
    it('should return all rules', async () => {
      const response = await request(testApp).get('/rules');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('conditions');
      expect(response.body[0]).toHaveProperty('action');
    });
  });

  describe('GET /rules/:id', () => {
    it('should return a rule by id', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const response = await request(testApp).get(`/rules/${ruleId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ruleId);
      expect(response.body.conditions).toBeDefined();
      expect(response.body.action).toBeDefined();
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(testApp).get('/rules/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Rule not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(testApp).get('/rules/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule id');
    });
  });

  describe('POST /rules', () => {
    it('should create a new rule', async () => {
      const newRule = {
        conditions: [
          { type: 'user-agent', is: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15' },
          { type: 'language', is: 'en' }
        ],
        action: { redirectTo: 'https://example.com' }
      };

      const response = await request(testApp)
        .post('/rules')
        .send(newRule);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.conditions).toEqual(newRule.conditions);
      expect(response.body.action).toEqual(newRule.action);
    });

    it('should return 400 when conditions is missing', async () => {
      const response = await request(testApp)
        .post('/rules')
        .send({ action: { redirectTo: 'https://test.com' } });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule data');
    });

    it('should return 400 when conditions is not an array', async () => {
      const response = await request(testApp)
        .post('/rules')
        .send({ conditions: 'not-array', action: { redirectTo: 'https://test.com' } });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule data');
    });

    it('should return 400 when action is missing', async () => {
      const response = await request(testApp)
        .post('/rules')
        .send({ conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }] });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule data');
    });

    it('should return 400 when redirectTo is missing', async () => {
      const response = await request(testApp)
        .post('/rules')
        .send({ 
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }],
          action: {}
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule data');
    });
  });

  describe('PUT /rules/:id', () => {
    it('should update an existing rule', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const updateData = {
        conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0' }],
        action: { redirectTo: 'https://updated.com' }
      };

      const response = await request(testApp)
        .put(`/rules/${ruleId}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ruleId);
      expect(response.body.conditions).toEqual(updateData.conditions);
      expect(response.body.action).toEqual(updateData.action);
    });

    it('should update only conditions', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;
      const originalAction = rules[0].action;

      const response = await request(testApp)
        .put(`/rules/${ruleId}`)
        .send({ conditions: [{ type: 'time', start: '10:00', end: '11:00' }] });
      
      expect(response.status).toBe(200);
      expect(response.body.conditions).toEqual([{ type: 'time', start: '10:00', end: '11:00' }]);
      expect(response.body.action).toEqual(originalAction);
    });

    it('should update only action', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;
      const originalConditions = rules[0].conditions;

      const response = await request(testApp)
        .put(`/rules/${ruleId}`)
        .send({ action: { redirectTo: 'https://new-action.com' } });
      
      expect(response.status).toBe(200);
      expect(response.body.action.redirectTo).toBe('https://new-action.com');
      expect(response.body.conditions).toEqual(originalConditions);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(testApp)
        .put('/rules/99999')
        .send({ conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }] });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Rule not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(testApp)
        .put('/rules/invalid')
        .send({ conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }] });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule id');
    });

    it('should return 400 when conditions is not an array', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const response = await request(testApp)
        .put(`/rules/${ruleId}`)
        .send({ conditions: 'not-array' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid conditions format');
    });

    it('should return 400 when action.redirectTo is missing', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const response = await request(testApp)
        .put(`/rules/${ruleId}`)
        .send({ action: {} });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid action format');
    });
  });

  describe('DELETE /rules/:id', () => {
    it('should delete an existing rule', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const response = await request(testApp).delete(`/rules/${ruleId}`);
      
      expect(response.status).toBe(204);
      expect(db.getRule(ruleId)).toBeUndefined();
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(testApp).delete('/rules/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Rule not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(testApp).delete('/rules/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule id');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(testApp).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});

