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
  isArchived?: boolean;
  reminderTime?: string; // HH:mm
  reminderFrequency?: 'daily' | 'weekly' | 'custom';
  priority?: 'low' | 'medium' | 'high';
}

export interface Log {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  status: 'done' | 'skip' | 'skipped' | 'fail' | 'none';
  timestamp: Date;
  note?: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    bg: string;
    primary: string;
    accent: string;
    glass: string;
    border: string;
    text: string;
    muted: string;
  };
  createdAt: Date;
}

export class AuraDB extends Dexie {
  habits!: Table<Habit>;
  logs!: Table<Log>;
  customThemes!: Table<CustomTheme>;

  constructor() {
    super('AuraDB');
    this.version(6).stores({
      habits: '++id, name, strictMode, isArchived, priority',
      logs: '++id, habitId, date, status',
      customThemes: 'id, name'
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
        streak: 0,
        priority: 'high'
      },
      {
        name: 'Workout',
        icon: 'Dumbbell',
        color: '#EF4444', // Red
        startDate: new Date(),
        createdAt: new Date(),
        strictMode: false,
        streak: 0,
        priority: 'medium'
      },
      {
        name: 'NoFap',
        icon: 'Shield',
        color: '#10B981', // Emerald
        startDate: new Date(),
        createdAt: new Date(),
        strictMode: true,
        streak: 0,
        priority: 'high'
      }
    ]);
  }
}
