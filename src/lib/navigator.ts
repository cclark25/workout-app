import { AppData } from 'src/components/data/data-manager';
import { Routine } from 'src/components/data/routine';

export class RoutineNavigator {
  public static refresh = 0;
  public static selectedRoutine?: Routine = AppData.singleton.routines[0];
  private static changeEventSubscriptions: ((routine: Routine) => void)[] = [];
  public static onSelectedChange(callback: (routine: Routine) => void) {
    RoutineNavigator.changeEventSubscriptions.push(callback);
  }

  public static getSelectedRoutine() {
    return RoutineNavigator.selectedRoutine;
  }
  public static setSelectedRoutine(routine: Routine) {
    RoutineNavigator.selectedRoutine = routine;
    RoutineNavigator.refresh++;
    for (const callback of RoutineNavigator.changeEventSubscriptions) {
      callback(routine);
    }
  }
}
