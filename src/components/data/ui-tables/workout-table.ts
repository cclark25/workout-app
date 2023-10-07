import { roundTo } from 'src/lib/helper-functions';
import { Workout } from '../workout';
import { IconLabel, UIColumn, UITable } from './ui-table';
import { DateTime } from 'luxon';
import { Routine } from '../routine';
import { AppData } from '../data-manager';

export class WorkoutTable extends UITable<Workout> {
  public baseColumns: UIColumn<Workout>[] = [
    UIColumn.fromGetSet(
      {
        name: 'lastTimeStamp',
        label: 'Date',
        format: (v: DateTime | null) => v?.toISODate() ?? '',
        sort(a: DateTime, b: DateTime) {
          return (
            (a?.toMillis() ?? Number.MAX_SAFE_INTEGER) -
            (b?.toMillis() ?? Number.MAX_SAFE_INTEGER)
          );
        },
        sortable: true,
        sortOrder: 'ad',
      },
      (r) => r.getLatestTimestamp()
    ),
    UIColumn.fromGetSet<Workout>(
      {
        name: 'setNumber',
        label: 'Number of Sets',
        sort(a, b) {
          return a - b;
        },
      },
      (r) => r.sets.length,
      undefined, //() => {},
      'number'
    ),
    UIColumn.fromKey<Workout>(
      {
        name: 'averageReps',
        label: 'Average Reps',
        format: (v: number) => roundTo(v, 2),
        sort(a, b) {
          return a - b;
        },
      },
      'averageReps',
      true,
      'number'
    ),
    UIColumn.fromGetSet<Workout>(
      {
        name: 'oneRepMax',
        label: '1 Rep Max', //new IconLabel('scale'), //'Average Weight',
        format: (v) => {
          return `${roundTo(v.value, 2)} ${v.units}`;
        },
        sort(a: { value: number }, b: { value: number }) {
          return a.value - b.value;
        },
        sortable: true,
      },
      (row) => row.getTargetRepWeight(1),
      undefined,
      'number'
    ),

    UIColumn.fromGetSet<Workout>(
      {
        name: 'totalEnergyExpended',
        label: new IconLabel('electric_bolt'), //'Total Estimated Energy Expended',
        sortable: true,
        format(v: number) {
          return `${roundTo(v, 0)} cal`;
        },
        sort(a: number, b: number) {
          return a - b;
        },
      },
      (row) =>
        row.sets
          .map((w) => w.getEnergyEstimate())
          .reduce((p, c) => p + c.value, 0),
      undefined,
      'number'
    ),
  ];

  public get columns() {
    return [...this.baseColumns];
  }

  public getData() {
    return this.routine.workouts;
  }

  public constructor(
    public routine: Routine,
    public targetRepCount: number[] = [1, 5, 10, 15, 20, 30]
  ) {
    super(routine.workouts, []);
  }

  public onRecordDialogHide() {
    this.routine.workouts = this.routine.workouts.filter(
      (d) => d.sets.length > 0
    );
    AppData.singleton.save();
  }
  public deleteRecord(row: Workout): void {
    this.routine.workouts = this.routine.workouts.filter(
      (d) => d.uuid !== row.uuid
    );
    AppData.singleton.save();
  }
  public buildNew(): Workout {
    return new Workout([], 'lbs', undefined, this.routine);
  }
}
