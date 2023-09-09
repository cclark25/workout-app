import { getWeightForRepGoal, roundTo } from 'src/lib/helper-functions';
import { WorkoutSet } from '../workout-set';
import { EditModeSymbol, UIColumn, UITable } from './ui-table';
import { Workout } from '../workout';

export class TargetRepsTable extends UITable<{ num: number }> {
  public constructor(public workout: Workout) {
    super(
      [],
      [
        UIColumn.fromGetSet<{ num: number }>(
          {
            name: 'targetReps',
            label: 'Target Reps',
            sort(a, b) {
              return a - b;
            },
          },
          (row) => row.num
        ),
        UIColumn.fromGetSet<{ num: number }>(
          {
            name: 'liftWeight',
            label: 'Required Lift Weight',
            format: (v: { value: number; units: string }) =>
              `${roundTo(v.value, 2)} ${v.units}`,
            sort(a, b) {
              return a - b;
            },
          },
          (row) => workout.getTargetRepWeight(row.num)
        ),
      ]
    );
  }

  public getData(): ({ num: number } & {
    [EditModeSymbol]?: boolean | undefined;
  })[] {
    return Array.from({ length: 30 }, (v, i) => ({ num: i + 1 }));
  }
  public onRecordDialogHide(row: { num: number }): void {
    return;
  }
  public deleteRecord(row: { num: number }): void {
    return;
  }
  public buildNew(): { num: number } {
    return { num: 0 };
  }
}
