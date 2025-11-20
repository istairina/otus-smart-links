import rulesData from './rules.json';
import { Rule } from '@shared/types';

const rules: Rule[] = [...rulesData];

export const db = {
  getRules: (): Rule[] => rules,
  getRule: (id: number): Rule | undefined => rules.find(r => r.id === id),
    
  putRule: (rule: Omit<Rule, 'id'>): Rule => {
    const maxId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) : 0;
    const newRule: Rule = {
      ...rule,
      id: maxId + 1,
    };
    rules.push(newRule);
    return newRule;
  },
    
  updateRule: (id: number, ruleData: Partial<Omit<Rule, 'id'>>): Rule | null => {
    const index = rules.findIndex(r => r.id === id);
    if (index === -1) {
      return null;
    }
        
    rules[index] = {
      ...rules[index],
      ...ruleData,
      id,
    };
    return rules[index];
  },
    
  deleteRule: (id: number): boolean => {
    const index = rules.findIndex(r => r.id === id);
    if (index === -1) {
      return false;
    }
        
    rules.splice(index, 1);
    return true;
  },
};