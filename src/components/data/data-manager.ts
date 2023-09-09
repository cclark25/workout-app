import { Routine, RoutineSerial, RoutineSerializer } from './routine';
import { LocalStorage } from 'quasar';

interface DataSerial {
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
    const serialData: DataSerial = {
      routines: this.routines.map((r) => this.routineSerializer.serialize(r)),
    };
    LocalStorage.set(AppData.workoutsKey, serialData);
  }

  private synchTimer(): void {
    this.save();
    setTimeout(() => this.synchTimer(), 5000);
  }
}
