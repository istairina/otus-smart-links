import request from 'supertest';
import express from 'express';
import { db } from '../data/action';
import { Rule } from '@shared/types';

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.get('/rules', (_req, res) => res.json(db.getRules()));

  app.get('/rules/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid rule id' });
    }
    
    const rule = db.getRule(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule);
  });

  app.post('/rules', (req, res) => {
    try {
      const { conditions, action } = req.body;
          
      if (!conditions || !Array.isArray(conditions) || !action || !action.redirectTo) {
        return res.status(400).json({ error: 'Invalid rule data' });
      }
          
      const newRule = db.putRule({ conditions, action });
      res.status(201).json(newRule);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create rule' });
    }
  });

  app.put('/rules/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid rule id' });
    }
    
    const { conditions, action } = req.body;
    const ruleData: Partial<Omit<Rule, 'id'>> = {};
    
    if (conditions !== undefined) {
      if (!Array.isArray(conditions)) {
        return res.status(400).json({ error: 'Invalid conditions format' });
      }
      ruleData.conditions = conditions;
    }
    
    if (action !== undefined) {
      if (!action.redirectTo) {
        return res.status(400).json({ error: 'Invalid action format' });
      }
      ruleData.action = action;
    }
    
    const updatedRule = db.updateRule(id, ruleData);
    if (!updatedRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(updatedRule);
  });

  app.delete('/rules/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid rule id' });
    }
    
    const deleted = db.deleteRule(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.status(204).send();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
};

describe('DB Service API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
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
      const response = await request(app).get('/rules');
      
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

      const response = await request(app).get(`/rules/${ruleId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ruleId);
      expect(response.body.conditions).toBeDefined();
      expect(response.body.action).toBeDefined();
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app).get('/rules/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Rule not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).get('/rules/invalid');
      
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

      const response = await request(app)
        .post('/rules')
        .send(newRule);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.conditions).toEqual(newRule.conditions);
      expect(response.body.action).toEqual(newRule.action);
    });

    it('should return 400 when conditions is missing', async () => {
      const response = await request(app)
        .post('/rules')
        .send({ action: { redirectTo: 'https://test.com' } });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule data');
    });

    it('should return 400 when conditions is not an array', async () => {
      const response = await request(app)
        .post('/rules')
        .send({ conditions: 'not-array', action: { redirectTo: 'https://test.com' } });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule data');
    });

    it('should return 400 when action is missing', async () => {
      const response = await request(app)
        .post('/rules')
        .send({ conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }] });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule data');
    });

    it('should return 400 when redirectTo is missing', async () => {
      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
        .put(`/rules/${ruleId}`)
        .send({ action: { redirectTo: 'https://new-action.com' } });
      
      expect(response.status).toBe(200);
      expect(response.body.action.redirectTo).toBe('https://new-action.com');
      expect(response.body.conditions).toEqual(originalConditions);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .put('/rules/99999')
        .send({ conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }] });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Rule not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app)
        .put('/rules/invalid')
        .send({ conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }] });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule id');
    });

    it('should return 400 when conditions is not an array', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const response = await request(app)
        .put(`/rules/${ruleId}`)
        .send({ conditions: 'not-array' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid conditions format');
    });

    it('should return 400 when action.redirectTo is missing', async () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const response = await request(app)
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

      const response = await request(app).delete(`/rules/${ruleId}`);
      
      expect(response.status).toBe(204);
      expect(db.getRule(ruleId)).toBeUndefined();
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app).delete('/rules/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Rule not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/rules/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rule id');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});

