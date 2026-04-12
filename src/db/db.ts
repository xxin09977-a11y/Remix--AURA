import Dexie, { type Table } from 'dexie';

export interface Habit {
  id?: number;
  name: string;
  icon: string;
  color: string;
  startDate: Date;
  createdAt: Date;
  strictMode: boolean;
  streak: number;
  lastCompleted?: Date;
}

export interface Log {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  status: 'done' | 'skip' | 'fail';
  timestamp: Date;
}

export class AuraDB extends Dexie {
  habits!: Table<Habit>;
  logs!: Table<Log>;

  constructor() {
    super('AuraDB');
    this.version(1).stores({
      habits: '++id, name, strictMode',
      logs: '++id, habitId, date, status'
    });
  }
}

export const db = new AuraDB();

// Seed default habits if empty
export async function seedDatabase() {
  const count = await db.habits.count();
  if (count === 0) {
    await db.habits.bulkAdd([
      {
        name: 'Meditation',
        icon: 'Brain',
        color: '#8B5CF6', // Violet
        startDate: new Date(),
        createdAt: new Date(),
        strictMode: true,
        streak: 0
      },
      {
        name: 'Workout',
        icon: 'Dumbbell',
        color: '#EF4444', // Red
        startDate: new Date(),
        createdAt: new Date(),
        strictMode: false,
        streak: 0
      },
      {
        name: 'NoFap',
        icon: 'Shield',
        color: '#10B981', // Emerald
        startDate: new Date(),
        createdAt: new Date(),
        strictMode: true,
        streak: 0
      }
    ]);
  }
}
