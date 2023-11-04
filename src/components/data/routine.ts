import { Serializer } from '../models';
import { Workout, WorkoutSerial, WorkoutSerializer } from './workout';
declare const crypto: any;

export class Routine {
  public workouts: Workout[] = [];
  public constructor(
    public name: string,
    public readonly uuid: string = crypto.randomUUID(),
    public configuration: { weightUnits: 'lbs' } = {
      weightUnits: 'lbs',
    }
  ) {}

  public getDisplayName() {
    // AppData.singleton.routines;
    // .filter((r) => r.name === this.name)
    // .indexOf(this) + 1
    return this.name;
  }

  public getLatestTimestamp() {
    return (
      this.workouts
        .flatMap((w) => w.getLatestTimestamp() ?? [])
        .sort((a, b) => a.toMillis() - b.toMillis())
        ?.pop() ?? null
    );
  }
}

export interface RoutineSerial {
  uuid?: string;
  workouts: WorkoutSerial[];
  name: string;
}

export class RoutineSerializer implements Serializer<Routine, RoutineSerial> {
  serialize(source: Routine): RoutineSerial {
    const serializer = new WorkoutSerializer();
    return {
      ...source,
      workouts: source.workouts.map((w) => serializer.serialize(w)),
    };
  }
  deserialize(source: RoutineSerial): Routine {
    const serializer = new WorkoutSerializer();
    const newRoutine = new Routine(source.name, source.uuid);

    newRoutine.workouts.push(
      ...source.workouts.map((w) => serializer.deserialize(w))
    );

    return newRoutine;
  }
}
