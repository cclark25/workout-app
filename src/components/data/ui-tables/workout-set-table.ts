import { IconLabel, UIColumn, UITable } from './ui-table';
import { WorkoutSet } from '../workout-set';
import { DateTime } from 'luxon';
import { Workout } from '../workout';
import { AppData } from '../data-manager';
import { calculateOneRepMax, roundTo } from 'src/lib/helper-functions';

export class WorkoutSetTable extends UITable<WorkoutSet> {
  public baseColumns: UIColumn<WorkoutSet>[] = [
    UIColumn.fromKey<WorkoutSet>(
      {
        name: 'recordTimestamp',
        label: 'Date',
        format: (v: DateTime) => {
          const time = v.toLocaleString(DateTime.TIME_WITH_SECONDS);
          const date = v.toISODate();
          if (v.hasSame(DateTime.now(), 'day')) {
            return time;
          }
          return date;
        },
        sort(a: DateTime, b: DateTime) {
          return a.toMillis() - b.toMillis();
        },
        sortOrder: 'ad',
      },
      'recordTimestamp',
      true,
      'number'
    ),
    UIColumn.fromKey<WorkoutSet>(
      {
        name: 'repCount',
        label: 'Reps',
        sort(a: number, b: number) {
          return a - b;
        },
      },
      'repCount',
      false,
      'number'
    ),
    UIColumn.fromKey<WorkoutSet>(
      {
        name: 'liftWeight',
        label: new IconLabel('scale'),
        sortable: true,
        format: (v: number, r?: WorkoutSet) => `${v} ${r?.weightUnits}`,
        sort(a: number, b: number) {
          return a - b;
        },
      },
      'liftWeight',
      false,
      'number'
    ),
    UIColumn.fromGetSet<WorkoutSet>(
      {
        name: 'oneRepMax',
        label: '1RM',
        sortable: true,
        format(v: ReturnType<typeof calculateOneRepMax>) {
          return `${roundTo(v, 2)} ${'lbs'}`;
        },
        sort(a: number, b: number) {
          return a - b;
        },
      },
      (row) => calculateOneRepMax(row),
      undefined,
      'number'
    ),

    UIColumn.fromGetSet<WorkoutSet>(
      {
        name: 'energyExpended',
        label: 'Cal', //new IconLabel('electric_bolt'),
        format(v: ReturnType<WorkoutSet['getEnergyEstimate']>) {
          return `${roundTo(v.value, 0)} ${v.unit}`;
        },
        sort(
          a: ReturnType<WorkoutSet['getEnergyEstimate']>,
          b: ReturnType<WorkoutSet['getEnergyEstimate']>
        ) {
          return a.value - b.value;
        },
      },
      (row) => row.getEnergyEstimate(this.workout.parentRoutine),
      undefined,
      'number'
    ),
  ];

  public get columns() {
    return [...this.baseColumns];
  }

  public getData() {
    return this.workout.sets;
  }

  public constructor(public workout: Workout) {
    super([], []);
  }

  public onRecordDialogHide(): void {
    throw new Error('Method not implemented.');
  }
  public deleteRecord(row: WorkoutSet): void {
    this.workout.sets = this.workout.sets.filter((d) => d.uuid !== row.uuid);
    AppData.singleton.save();
  }
  public buildNew(): WorkoutSet {
    const lastWorkout = [...(this.workout.parentRoutine?.workouts ?? [])]
      .sort(
        (a, b) =>
          (a.getLatestTimestamp()?.toMillis() ?? 0) -
          (b.getLatestTimestamp()?.toMillis() ?? 0)
      )
      .pop();

    const lastSet =
      [...this.workout.sets]
        .sort(
          (a, b) => a.recordTimestamp.toMillis() - b.recordTimestamp.toMillis()
        )
        .pop() ??
      [...(lastWorkout?.sets ?? [])]
        .sort(
          (a, b) => a.recordTimestamp.toMillis() - b.recordTimestamp.toMillis()
        )
        .pop();

    return new WorkoutSet(
      lastSet?.repCount ?? 0,
      lastSet?.liftWeight ?? 0,
      DateTime.now(),
      lastSet?.weightUnits
    );
  }
}
