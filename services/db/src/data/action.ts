import rules from './rules.json';

export const db = {
    getRules: () => rules,
    getRule: (id: number) => rules.find(r => r.id === id),
    // TODO: put, update and delete rule
};