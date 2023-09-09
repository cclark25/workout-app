import { UIColumn, UITable } from './ui-table';
import { AppData } from '../data-manager';
import { Routine } from '../routine';
import { RoutineNavigator } from 'src/lib/navigator';
import { DateTime } from 'luxon';

export class RoutineTable extends UITable<Routine> {
  public baseColumns: UIColumn<Routine>[] = [
    UIColumn.fromGetSet<Routine>(
      {
        name: 'displayName',
        label: 'Routine',
        sort(a: string, b: string, rowA, rowB) {
          return a < b ? -1 : 1;
        },
        sortable: true,
      },
      (routine) => routine.getDisplayName(),
      undefined,
      'text'
    ),
    UIColumn.fromGetSet<Routine>(
      {
        name: 'lastTimestamp',
        label: 'Last Workout',
        sort(a: DateTime | null, b: DateTime | null, rowA, rowB) {
          return (a?.toMillis() ?? 0) - (b?.toMillis() ?? 0);
        },
        format: (v: DateTime | null) => {
          if (!v) {
            return '';
          }
          const time = v.toLocaleString(DateTime.TIME_WITH_SECONDS);
          const date = v.toISODate();
          if (v.hasSame(DateTime.now(), 'day')) {
            return time;
          }
          return date;
        },
        sortable: true,
        sortOrder: 'ad',
      },
      (r) => r.getLatestTimestamp()
    ),
  ];

  public get columns() {
    return [...this.baseColumns];
  }

  public getData() {
    return this.routineGroup?.routines ?? [];
  }

  public constructor(public routineGroup: { routines: Routine[] }) {
    super([], []);
  }

  public onRecordDialogHide(): void {
    return undefined;
  }
  public deleteRecord(row: Routine): void {
    this.routineGroup.routines = this.routineGroup.routines.filter(
      (d) => d.uuid !== row.uuid
    );
    AppData.singleton.save();
  }
  public buildNew(): Routine {
    return new Routine('New Workout');
  }

  public rowSelected(row: Routine): void {
    RoutineNavigator.setSelectedRoutine(row);
    console.log('rowSelected called');
  }
}
