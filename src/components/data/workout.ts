import {
  average,
  calculateOneRepMax,
  getWeightForRepGoal,
} from 'src/lib/helper-functions';
import {
  WorkoutSetSerial,
  WorkoutSet,
  WorkoutSetSerializer,
} from './workout-set';
import { Serializer } from '../models';
import { Routine } from './routine';
import { DateTime } from 'luxon';
declare const crypto: any;

export interface WorkoutSerial {
  sets: WorkoutSetSerial[];
  weightUnits: 'lbs';
  uuid?: string;
  notes?: string;
}

export class Workout {
  constructor(
    public sets: WorkoutSet[],
    public weightUnits = sets[0]?.weightUnits ?? 'lbs',
    public readonly uuid: string = crypto.randomUUID(),
    public parentRoutine?: Routine
  ) {}

  public notes = '';

  public get averageReps() {
    return average(this.sets.map((s) => s.repCount));
  }

  public get averageWeight() {
    const avg = {
      value: average(this.sets.map((s) => s.liftWeight)),
      units: this.weightUnits,
    };
    return avg;
  }

  public get totalCalories() {
    return {
      value: this.sets.reduce(
        (p, c) => p + c.getEnergyEstimate(this.parentRoutine).value,
        0
      ),
      unit: 'lbs' as const,
    };
  }

  public getLatestTimestamp() {
    return (
      this.sets
        .map((s) => s.recordTimestamp)
        .sort((a, b) => (a < b ? -1 : 1))
        ?.pop() ?? null
    );
  }

  public getTargetRepWeight(repMaxesToDisplay: number) {
    const ormSets = this.sets
      .filter((s) => s.liftWeight > 0 && s.repCount > 0)
      .map((s) => getWeightForRepGoal(repMaxesToDisplay, s));

    const target = {
      value: ormSets.reduce((p, c) => (c > p ? c : p), 0),
      units: this.weightUnits,
    };

    return target;
  }
  public calculateOneRepMax() {
    return average(
      this.sets.map((s) =>
        calculateOneRepMax(
          new WorkoutSet(s.repCount, s.liftWeight, DateTime.now())
        )
      )
    );
  }
}

export class WorkoutSerializer implements Serializer<Workout, WorkoutSerial> {
  public constructor(
    public workoutSetSerializer: WorkoutSetSerializer = new WorkoutSetSerializer()
  ) {}

  public serialize(source: Workout): WorkoutSerial {
    return {
      uuid: source.uuid,
      weightUnits: source.weightUnits,
      sets: source.sets.map((s) => this.workoutSetSerializer.serialize(s)),
      notes: source.notes,
    };
  }
  public deserialize(source: WorkoutSerial): Workout {
    const newWorkout = new Workout(
      source.sets.map((s) => this.workoutSetSerializer.deserialize(s)),
      source.weightUnits,
      source.uuid
    );
    newWorkout.notes = source.notes ?? '';

    return newWorkout;
  }
}
