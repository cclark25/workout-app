<template>
  <div-table
    v-if="routine"
    selectable
    :tableManager="table"
    :key="routine.uuid"
    ref="workoutTable"
    :dialog-tabs="[
      { key: 'setData', label: 'Set Data' },
      { key: 'repMaxes', label: 'Target Rep Maxes' },
      { key: 'setGraphs', label: 'Graphs' },
    ]"
  >
    <template v-slot:expand-section="props">
      <div-table
        :tableManager="
          (currentWorkoutSetTable = new WorkoutSetTable(props.row))
        "
        ref="setsTable"
        v-if="props.dialogTabSelected === 'setData'"
      >
        <template v-slot:footer-left>
          <div class="elapsed-time" :key="timerTicks">
            {{
              getElapsedTime(
                (props.row as Workout).getLatestTimestamp() ?? DateTime.now()
              )
            }}
          </div>
        </template>
      </div-table>

      <div-table
        class="dialog-target-reps"
        readonly
        title="Lift weights equivalent to this 1 Rep
        Max"
        v-else-if="props.dialogTabSelected === 'repMaxes'"
        hide-bottom
        :table-manager="new TargetRepsTable((props.row as Workout))"
        32
      >
        <template v-slot:footer-left>
          <div class="elapsed-time" :key="timerTicks">
            {{
              getElapsedTime(
                (props.row as Workout).getLatestTimestamp() ?? DateTime.now()
              )
            }}
          </div>
        </template>
      </div-table>
    </template>

    <template v-slot:footer-left>
      <div class="elapsed-time" :key="timerTicks">
        {{
          getElapsedTime(
            table.data
              .flatMap((w) => w.getLatestTimestamp() ?? [])
              .sort((a, b) => b.toMillis() - a.toMillis())[0] ?? DateTime.now()
          )
        }}
      </div>
    </template>
  </div-table>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, Ref } from 'vue';
import { Routine } from './data/routine';
import { average, getWeightForRepGoal, roundTo } from '../lib/helper-functions';
import { WorkoutSetTable } from '../components/data/ui-tables/workout-set-table';
import DivTable from 'components/DivTable.vue';
import { WorkoutTable } from './data/ui-tables/workout-table';
import { DateTime } from 'luxon';
import { Workout } from './data/workout';
import { TargetRepsTable } from './data/ui-tables/target-reps-table';

export default defineComponent({
  name: 'WorkoutsTable',
  components: {
    DivTable,
  },
  props: {
    routine: {
      type: Routine,
      required: false,
    },
    repMaxesToDisplay: {
      type: Array as PropType<number[]>,
      default: () => [1, 5, 15, 20, 30],
    },
  },
  data() {
    return {
      timerPromise: this.timerTicker(),
      elapsedTime: '',
      timerTicks: 0,
      workoutInProgress: 0,
      table: new WorkoutTable(this.routine ?? new Routine('unnamed routine')),
      currentWorkoutSetTable: undefined as WorkoutSetTable | undefined,
    };
  },
  methods: {
    getElapsedTime(date: DateTime) {
      return (
        date
          .diffNow()
          .negate()
          .shiftTo('day', 'hour', 'minute', 'second')
          .toHuman({ unitDisplay: 'short', maximumFractionDigits: 0 }) ?? ''
      );
    },

    timerTicker: async function () {
      this.timerTicks++;
      setTimeout(this.timerTicker, 1000);
    },
  },
  setup() {
    return {
      average,
      getWeightForRepGoal,
      roundTo,
      WorkoutSetTable,
      DateTime,
      TargetRepsTable,
    };
  },
  mounted() {
    const tableManager = this.$refs.workoutTable as any;
    tableManager?.onDialogClose(() => {
      this.currentWorkoutSetTable?.clearEditModes();
    });
  },
});
</script>
