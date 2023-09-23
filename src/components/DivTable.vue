<template>
  <q-dialog maximized v-if="expandable" :model-value="rowSelectedChange">
    <div class="dialog">
      <div class="dialog-header">
        <q-tabs
          align="left"
          class="dialog-tabs"
          v-model="dialogTabSelected"
          active-bg-color="grey-4"
        >
          <q-tab
            v-for="tab in dialogTabs"
            :name="tab.key"
            :label="tab.label"
            :key="tab.key"
          />
        </q-tabs>

        <q-btn
          class="dialog-close-div"
          flat
          icon="close"
          @click="dialogHidden()"
        ></q-btn>
      </div>

      <div class="dialog-body">
        <slot
          name="expand-section"
          :row="selectedRow"
          :onClose="onDialogClose"
          :dialogTabSelected="dialogTabSelected"
        ></slot>
      </div>
    </div>
  </q-dialog>

  <div class="div-table-wrapper">
    <div class="div-table" style="display: table">
      <div class="div-table-header" style="display: table-row">
        <div
          v-for="column in tableManager.columns"
          :key="column.name"
          class="div-table-header-cell"
          style="display: table-cell"
          @click="toggleSort(column)"
        >
          <template v-if="column.label instanceof IconLabel">
            <q-icon :name="(column.label as IconLabel).iconName" />
          </template>
          <template v-else>{{ column.label }}</template>
          {{
            tableManager.sortColumn === column
              ? tableManager.sortColumn.sortOrder === 'ad'
                ? '\u25B2'
                : '\u25BC'
              : ''
          }}
        </div>
      </div>

      {{ ((displayedRowNumber = 1), undefined) }}

      <div
        v-for="row in getSortedTableData()"
        :class="'div-table-body'"
        :key="row[tableManager.tableKey]"
        style="display: contents"
      >
        <div
          :ref="`row-${row[tableManager.tableKey]}`"
          style="display: table-row"
          :class="`${displayedRowNumber++ % 2 ? 'odd' : 'even'}-row`"
          @mousedown="
            mouseTouchStart(
              500,
              row,
              () => editRow(row),
              () => selectRow(row)
            )
          "
          @mouseup="mouseTouchEnd(row)"
          @touchstart="
            mouseTouchStart(
              500,
              row,
              () => editRow(row),
              () => {}
            )
          "
          @touchend="mouseTouchEnd(row)"
        >
          <div
            v-for="column in tableManager.columns"
            :key="column.name"
            style="display: table-cell"
            :class="
              'div-table-body-cell' +
              (row === selectedRow ? ' selected-row' : '')
            "
          >
            <q-input
              v-if="tableManager.isRecordInEditMode(row) && !column.isReadOnly"
              v-model="column.getModel(row).value"
              :type="column.inputType ?? 'text'"
            />

            <template v-else>
              {{
                column.format
                  ? column.format(
                      typeof column.field === 'function'
                        ? column.field(row)
                        : row[column.field],
                      row
                    )
                  : typeof column.field === 'function'
                  ? column.field(row)
                  : row[column.field]
              }}
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="ui-table-footer">
    <slot name="footer-left"> </slot>

    <div>
      <q-btn
        class="add-record-button"
        flat
        :disable="readonly"
        icon="add"
        @click="addRecord()"
      ></q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { UITable, IconLabel, UIColumn } from './data/ui-tables/ui-table';
import { AppData } from './data/data-manager';
import { DateTime } from 'luxon';

export default defineComponent({
  name: 'DivTable',
  props: {
    tableManager: {
      type: UITable as PropType<UITable<any>>,
      required: true,
    },
    selectable: {
      type: Boolean,
    },
    expandable: {
      type: Boolean,
    },
    rowSelected: {
      type: Function,
      default: () => () => undefined,
    },
    dialogTabs: {
      type: Array as PropType<{ key: string; label: string }[]>,
      default: () => [],
    },
    readonly: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    const data = {
      targetIndex: undefined as string | undefined,
      rowSelectedChange: false,
      dialogCloseCallbacks: [] as (() => void)[],
      selectedRow: undefined as any,
      dialogTabSelected: this.dialogTabs[0]?.key,
      mouseTouchStateSymbol: Symbol('MouseTouchStateSymbol'),
    };

    return data;
  },
  updated() {
    this.scrollToTarget();
  },

  methods: {
    mouseTouchStart(
      timeout: number,
      row: any,
      onHold: () => void,
      onClick: () => void
    ) {
      if (row[this.mouseTouchStateSymbol]) {
        return;
      }

      row[this.mouseTouchStateSymbol] = { onClick };

      const state = row[this.mouseTouchStateSymbol];

      state['timestamp'] = DateTime.now();

      setTimeout(() => {
        state['timedOut'] = true;
        if (row[this.mouseTouchStateSymbol] === state) {
          onHold();
        }
      }, timeout);
    },

    mouseTouchEnd(row: any) {
      const timeoutObj = row[this.mouseTouchStateSymbol];
      const timedOut = !!timeoutObj?.['timedOut'];
      if (!timedOut) {
        timeoutObj['onClick']?.();
      }
      row[this.mouseTouchStateSymbol] = undefined;
    },

    scrollToTarget() {
      if (this.targetIndex !== undefined) {
        const refEl = (this.$refs[`row-${this.targetIndex}`] as any)?.[0];
        console.log('refEl: ', refEl);

        refEl?.scrollIntoView({
          block: 'end',
          behavior: 'smooth',
        });

        if (
          !this.$refs[this.targetIndex] ||
          !this.tableManager.isRecordInEditMode(
            (this.$refs[this.targetIndex] as any)?.props.row
          ) ||
          !this.tableManager.isEditable()
        ) {
          this.targetIndex = undefined;
        }
      }
    },
    editRow(row: any) {
      this.tableManager.toggleRecordInEditMode(row);
      this.targetIndex = row[this.tableManager.tableKey];

      this.$forceUpdate();
    },
    dialogHidden() {
      for (const callback of this.dialogCloseCallbacks) {
        callback();
      }
      this.rowSelectedChange = false;
      if (this.selectedRow) {
        this.tableManager.onRecordDialogHide(this.selectedRow);
        this.deselectRow();
      }
      AppData.singleton.save();
    },

    onDialogClose(callback: () => void) {
      this.dialogCloseCallbacks.push(callback);
    },

    selectRow(row: any) {
      this.selectedRow = row;
      if (this.expandable) {
        this.rowSelectedChange = true;
      }
      this.tableManager.rowSelected(row);
      this.rowSelected();
      if (!this.selectable) {
        this.deselectRow();
      }
    },

    deselectRow() {
      this.selectedRow = undefined;
    },

    clearEdits() {
      this.tableManager.clearEditModes();
    },

    addRecord() {
      const newRecord = this.tableManager.addNewRecord();

      this.selectRow(newRecord);
      this.editRow(newRecord);
    },

    getSortedTableData() {
      const copy = [...this.tableManager.data];
      const sorter = this.tableManager.sortColumn?.sort;
      const sortColumn = this.tableManager.sortColumn;
      const direction = sortColumn?.sortOrder === 'ad' ? 1 : -1;
      if (!sortColumn) {
        return copy;
      }

      return copy.sort(
        (a, b) =>
          (sorter?.(
            sortColumn.getModel(a).value,
            sortColumn.getModel(b).value,
            a,
            b
          ) ?? 0) * direction
      );
    },
    toggleSort(column: UIColumn<any>) {
      if (!column.sort) {
        return;
      }

      const sortOrder = column.sortOrder ?? 'da';

      if (column !== this.tableManager.sortColumn) {
        column.sortOrder = 'ad';
        (this.tableManager.sortColumn as any) = column;
      } else if (sortOrder === 'ad') {
        column.sortOrder = 'da';
      } else if (sortOrder === 'da') {
        column.sortOrder = 'ad';
      }

      this.$forceUpdate();
    },
  },
  setup() {
    return { IconLabel, displayedRowNumber: 1 };
  },
});
</script>
