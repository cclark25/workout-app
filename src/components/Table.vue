<template>
  <q-dialog maximized v-if="selectable" :model-value="rowSelectedChange">
    <div class="dialog">
      <div class="dialog-header">
        <q-btn
          class="dialog-close-div"
          flat
          icon="close"
          @click="
            dialogHidden();
            rowSelectedChange = false;
          "
        ></q-btn>
      </div>

      <div class="dialog-body">
        <slot
          name="expand-section"
          :row="selectedRow"
          :onClose="onDialogClose"
        ></slot>
      </div>
    </div>
  </q-dialog>

  <div class="table">
    <div class="table-data">
      <q-table
        style="height: 100%"
        :title="title ?? ''"
        ref="qtableRef"
        wrap-cells
        :pagination="{ rowsPerPage: 0, sortBy: table.columns[0].name }"
        :rows="table.data"
        :columns="(table.columns as any[])"
        row-key="uuid"
      >
        <template v-slot:body="props">
          <q-tr
            :props="props"
            :ref="props.row[targetSymbol]"
            v-touch-swipe="(event) => swipeRecord(event, props)"
          >
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              @click="
                !['editButton', 'deleteButton'].includes(col.name)
                  ? selectRow(props.row)
                  : undefined
              "
            >
              <input
                v-if="
                  col.getModel &&
                  table.isRecordInEditMode(props.row) &&
                  !col.isReadOnly
                "
                v-model="col.getModel(props.row).value"
                :type="col.inputType ?? 'text'"
                width="100%"
              />

              <template v-else>
                {{
                  col.format
                    ? col.format(col.field(props.row), props.row)
                    : col.field(props.row)
                }}
              </template>
            </q-td>
          </q-tr>

          <!-- <q-td :colspan="table.columns.length" v-show="rowSwiped > 0"> -->
          <q-slide-transition>
            <div
              v-show="rowSwiped > 0"
              :style="`text-align: center; width: calc(100% * ${table.columns.length})`"
            >
              <q-btn
                class="row-delete-button"
                flat
                icon="delete"
                style="width: 100%"
                @click="
                  table.toggleRecordInEditMode(props.row);
                  table.deleteRecord(props.row);
                "
              />
            </div>
          </q-slide-transition>

          <q-slide-transition>
            <div
              :ref="`edit-button-slide-${props.row[targetSymbol]}`"
              v-show="rowSwiped < 0"
              :style="`text-align: center; width: calc(100%)`"
              column-span="all"
            >
              <q-btn
                class="row-edit-button"
                flat
                style="width: 100%"
                :icon="table.isRecordInEditMode(props.row) ? 'done' : 'edit'"
                @click="editRow(props.row)"
              />
            </div>
          </q-slide-transition>
          <!-- </q-td> -->
        </template>

        <template v-slot:bottom-row>
          <q-tr ref="lastRow" id="lastRow"></q-tr>
        </template>

        <template v-slot:header-cell="props">
          <th v-if="props.col.label instanceof IconLabel">
            <q-icon :name="(props.col.label as IconLabel).iconName" />
          </th>
          <th v-else>{{ props.col.label }}</th>
        </template>
      </q-table>
    </div>

    <slot name="footer">
      <div class="ui-table-footer">
        <slot name="footer-left"> </slot>
        <q-btn flat icon="add" @click="addRecord()"></q-btn>
      </div>
    </slot>
  </div>
  <!-- <div :key="elapsedTime">{{ elapsedTime }}</div> -->
</template>

<script lang="ts">
import { CSSProperties, defineComponent, PropType } from 'vue';
import { IconLabel, UITable } from './data/ui-tables/ui-table';
import { QTable, QTableSlots, TouchSwipeValue } from 'quasar';
import { AppData } from './data/data-manager';

export default defineComponent({
  name: 'TableManager',
  props: {
    title: {
      type: String,
    },
    table: {
      type: UITable as PropType<UITable<any>>,
      required: true,
    },
    selectable: {
      type: Boolean,
    },
    rowSelected: {
      type: Function,
      default: () => () => undefined,
    },
  },
  data() {
    const data = {
      targetSymbol: Symbol('targetRow'),
      targetNumber: 0,
      targetIndex: undefined as string | undefined,
      rowSelectedChange: false,
      selectedRow: undefined as
        | Parameters<QTableSlots['body']>[0]['row']
        | undefined,
      dialogCloseCallbacks: [] as (() => void)[],
      rowSwiped: 0 as -1 | 0 | 1,
    };

    for (const record of this.table.data) {
      record[data.targetSymbol] = data.targetNumber;
      data.targetNumber++;
    }

    return data;
  },
  updated() {
    this.scrollToTarget();
  },
  methods: {
    scrollToTarget() {
      if (this.targetIndex !== undefined) {
        console.log('Scroll to target: ', this.$refs[this.targetIndex] as any);
        (this.$refs[this.targetIndex] as any)?.$el.scrollIntoView({
          block: 'end',
          behavior: 'smooth',
        });

        if (
          !this.$refs[this.targetIndex] ||
          !this.table.isRecordInEditMode(
            (this.$refs[this.targetIndex] as any)?.props.row
          ) ||
          !this.table.isEditable()
        ) {
          this.targetIndex = undefined;
        }
      }
    },
    addRecord() {
      const newRecord = this.table.addNewRecord();
      newRecord[this.targetSymbol] = this.targetNumber;
      this.targetNumber++;

      this.selectRow(newRecord);
      this.editRow(newRecord);
    },
    selectRow(row: Parameters<QTableSlots['body']>[0]['row']) {
      this.selectedRow = row;
      if (this.selectable) {
        this.rowSelectedChange = true;
      }
      this.table.rowSelected(row);
      this.rowSelected();
    },
    dialogHidden() {
      for (const callback of this.dialogCloseCallbacks) {
        callback();
      }
      this.rowSelectedChange = false;
      this.table.onRecordDialogHide(this.selectedRow);
      this.editRow(this.selectedRow);
      AppData.singleton.save();
    },
    editRow(row: any) {
      this.table.toggleRecordInEditMode(row);
      this.targetIndex = row[this.targetSymbol];
    },
    onDialogClose(callback: () => void) {
      this.dialogCloseCallbacks.push(callback);
    },
    clearEdits() {
      this.table.clearEditModes();
    },
    swipeRecord(
      event: Parameters<Exclude<TouchSwipeValue, undefined>>[0],
      row: any
    ) {
      console.log(event);
      let swipeDirection = this.rowSwiped;
      switch (event.direction) {
        case 'left':
          swipeDirection -= 1;
          break;
        case 'right':
          swipeDirection += 1;
          break;
      }
      if (!this.table.isEditable() && swipeDirection < 0) {
        swipeDirection = 0;
      }

      this.rowSwiped = (swipeDirection / Math.abs(swipeDirection) || 0) as
        | -1
        | 0
        | 1; // < 0 ? -1 : swipeDirection > 0 ? 1 : 0;
    },
  },
  setup() {
    return { UITable, IconLabel, newRecordEventQueue: [] as any[] };
  },
});
</script>
