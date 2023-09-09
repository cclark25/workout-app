import { QTableProps } from 'quasar';
import { AppData } from '../data-manager';

export type QColumn = {
  /**
   * Unique id, identifies column, (used by pagination.sortBy, 'body-cell-[name]' slot, ...)
   */
  name: string;
  /**
   * Label for header
   */
  label: string | IconLabel;
  /**
   * Row Object property to determine value for this column or function which maps to the required property
   * @param row The current row being processed
   * @returns Value for this column
   */
  field: string | ((row: any) => any);
  /**
   * If we use visible-columns, this col will always be visible
   */
  required?: boolean;
  /**
   * Horizontal alignment of cells in this column
   * Default value: right
   */
  align?: 'left' | 'right' | 'center';
  /**
   * Tell QTable you want this column sortable
   */
  sortable?: boolean;
  /**
   * Compare function if you have some custom data or want a specific way to compare two rows
   * @param a Value of the first comparison term
   * @param b Value of the second comparison term
   * @param rowA Full Row object in which is contained the first term
   * @param rowB Full Row object in which is contained the second term
   * @returns Comparison result of term 'a' with term 'b'. Less than 0 when 'a' should come first; greater than 0 if 'b' should come first; equal to 0 if their position must not be changed with respect to each other
   */
  sort?: (a: any, b: any, rowA: any, rowB: any) => number;
  /**
   * Set column sort order: 'ad' (ascending-descending) or 'da' (descending-ascending); Overrides the 'column-sort-order' prop
   * Default value: ad
   */
  sortOrder?: 'ad' | 'da';
  /**
   * Function you can apply to format your data
   * @param val Value of the cell
   * @param row Full Row object in which the cell is contained
   * @returns The resulting formatted value
   */
  format?: (val: any, row: any) => any;
  /**
   * Style to apply on normal cells of the column
   * @param row The current row being processed
   */
  style?: string | ((row: any) => string);
  /**
   * Classes to add on normal cells of the column
   * @param row The current row being processed
   */
  classes?: string | ((row: any) => string);
  /**
   * Style to apply on header cells of the column
   */
  headerStyle?: string;
  /**
   * Classes to add on header cells of the column
   */
  headerClasses?: string;
};

export const EditModeSymbol = Symbol('EditMode');

export class IconLabel {
  constructor(public iconName: string) {}
}

export class UIColumn<T> implements QColumn {
  public name = '';
  public label: string | IconLabel = '';
  public field: string | ((row: any) => any) = '';
  public sort?: ((a: any, b: any, rowA: any, rowB: any) => number) | undefined;
  public sortOrder?: 'ad' | 'da' | undefined;
  public format?: ((val: any, row: any) => any) | undefined;

  private get: (r: T) => any = () => undefined;
  private set?: (r: T, v: any) => void;

  private constructor(
    public isReadOnly: boolean,
    public inputType: 'number' | 'text',
    qDef: QColumn
  ) {
    Object.assign(this, qDef);
  }

  private _getModel = function (this: UIColumn<T>, r: T) {
    const getter = this.get.bind(this);
    const setter = this.set?.bind(this);
    return {
      get value() {
        return getter(r);
      },
      set value(v: any) {
        setter?.(r, v);
      },
    };
  }.bind(this);

  public getModel = (r: T) => {
    return this._getModel(r);
  };

  public static fromGetSet<T>(
    qDef: Omit<QColumn, 'field'>,
    get: (r: T) => any,
    set?: (r: T, v: any) => void,
    inputType: 'number' | 'text' = 'text'
  ) {
    const newCol = new UIColumn<T>(!set, inputType, {
      ...qDef,
      field: (row: any) => get(row),
    });
    newCol.get = get;
    newCol.set = set;
    return newCol;
  }

  public static fromKey<T>(
    qDef: Omit<QColumn, 'field'>,
    key: keyof T,

    isReadOnly = false,
    inputType: 'number' | 'text' = 'text'
  ) {
    const newCol = new UIColumn<T>(isReadOnly, inputType, {
      ...qDef,
      field: (row: any) => undefined,
    });
    newCol.get = (r: T) => r[key];
    newCol.set = (r: T, v: any) => (r[key] = v);
    newCol.field = (row: any) => newCol.get(row);

    return newCol;
  }
}

export abstract class UITable<
  T extends object & { [EditModeSymbol]?: boolean }
> {
  private _columns: UIColumn<T>[] = [];

  public get columns(): UIColumn<T>[] {
    return this._columns;
  }

  private _sortColumn: UIColumn<T> | undefined;
  public get sortColumn(): UIColumn<T> | undefined {
    const column = this._sortColumn ?? this.columns[0];
    if (!column.sortOrder) {
      column.sortOrder = 'ad';
    }
    return column;
  }
  public set sortColumn(column: UIColumn<T> | undefined) {
    this._sortColumn = column;
  }

  public abstract getData(): (T & {
    [EditModeSymbol]?: boolean;
  })[];

  public get data(): (T & {
    [EditModeSymbol]?: boolean;
  })[] {
    const data = this.getData();
    for (const d of data) {
      if (!(this.tableKey in d)) {
        (d as any)[this.tableKey] = this.tableKeyIndex;
        this.tableKeyIndex++;
      }
    }

    return data;
  }
  public constructor(
    private _data: (T & { [EditModeSymbol]?: boolean })[],
    columns: UIColumn<T>[]
  ) {
    this._columns = columns;
  }

  public readonly tableKey = Symbol('ui-table-key');
  private tableKeyIndex = 0;

  public cssClass = ''; //'pure-table pure-table-horizontal pure-table-striped';

  public isRecordInEditMode(d: T) {
    const toggled = d[EditModeSymbol];

    return toggled;
  }
  public toggleRecordInEditMode(d: T) {
    for (const row of this.data) {
      if (row !== d) {
        row[EditModeSymbol] = false;
      }
    }

    d[EditModeSymbol] = !d[EditModeSymbol];
    AppData.singleton.save();
    return undefined;
  }

  public isEditable() {
    return !!this.columns.find((c) => !c.isReadOnly);
  }

  public addNewRecord() {
    if (this.buildNew) {
      const newVal = this.buildNew();
      (newVal as any)[this.tableKey] = this.tableKeyIndex;
      this.tableKeyIndex++;
      this.data.push(newVal);
      return newVal;
    }

    AppData.singleton.save();
    return undefined;
  }

  public abstract onRecordDialogHide(row: T): void;
  public abstract deleteRecord(row: T): void;

  public abstract buildNew(): T;

  public rowSelected(row: T) {
    console.log('Not overridden');
  }

  public clearEditModes() {
    for (const row of this.data) {
      row[EditModeSymbol] = false;
      console.log('Clearing edits');
    }
  }
}
