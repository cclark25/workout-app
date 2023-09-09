import { Ref } from 'vue';
import { WorkoutSerializer } from './data/workout';
import { WorkoutSetSerializer } from './data/workout-set';

export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Serializer<T, S> {
  serialize(source: T): S;
  deserialize(source: S): T;
}

export const Serializers = {
  workoutSet: new WorkoutSetSerializer(),
  workouts: new WorkoutSerializer(),
} as const;
