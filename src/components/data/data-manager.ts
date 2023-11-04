import { Routine, RoutineSerial, RoutineSerializer } from './routine';
import { LocalStorage } from 'quasar';
import { Workout } from './workout';

export interface DataSerial {
  routines: RoutineSerial[];
}

export class AppData {
  public static workoutsKey = 'workoutAppData';
  public static singleton = new AppData();
  public routineSerializer = new RoutineSerializer();
  public routines: Routine[];

  public constructor() {
    if (!LocalStorage.has(AppData.workoutsKey)) {
      LocalStorage.set(AppData.workoutsKey, { routines: [] } as DataSerial);
    }

    const dataSerial = LocalStorage.getItem(AppData.workoutsKey) as DataSerial;

    this.routines = dataSerial.routines.map((r) =>
      new RoutineSerializer().deserialize(r)
    );

    this.synchTimer();
  }

  public save() {
    const serialData: DataSerial = this.serialize();
    LocalStorage.set(AppData.workoutsKey, serialData);
  }
  public serialize(): DataSerial {
    return {
      routines: this.routines.map((r) => this.routineSerializer.serialize(r)),
    };
  }

  public mergeWorkouts(existingWorkouts: Workout, incomingWorkout: Workout) {
    for (const incomingSet of incomingWorkout.sets) {
      const existingSet = existingWorkouts.sets.find(
        (s) => s.uuid === incomingSet.uuid
      );

      if (!existingSet) {
        existingWorkouts.sets.push(incomingSet);
      } else {
        existingSet.repCount = incomingSet.repCount;
        existingSet.liftWeight = incomingSet.liftWeight;
        existingSet.weightUnits = incomingSet.weightUnits;
        existingSet.recordTimestamp = incomingSet.recordTimestamp;
      }
    }
  }

  public mergeRoutines(existingRoutine: Routine, incomingRoutine: Routine) {
    for (const incomingWorkout of incomingRoutine.workouts) {
      const existingWorkout = existingRoutine.workouts.find(
        (w) => w.uuid === incomingWorkout.uuid
      );

      if (!existingWorkout) {
        existingRoutine.workouts.push(incomingWorkout);
      } else {
        existingWorkout.weightUnits = incomingWorkout.weightUnits;
        this.mergeWorkouts(existingWorkout, incomingWorkout);
      }
    }
  }

  public mergeData(routines: Routine[]) {
    for (const incomingRoutine of routines) {
      const existingRoutine = this.routines.find(
        (r) => r.uuid === incomingRoutine.uuid
      );
      const existingRoutineName = this.routines.find(
        (r) => r.name === incomingRoutine.name
      );

      if (!existingRoutine) {
        this.routines.push(incomingRoutine);
      } else {
        existingRoutine.configuration = incomingRoutine.configuration;
        existingRoutine.name = incomingRoutine.name;
        this.mergeRoutines(existingRoutine, incomingRoutine);
      }
    }
  }

  private synchTimer(): void {
    this.save();
    setTimeout(() => this.synchTimer(), 5000);
  }
}
