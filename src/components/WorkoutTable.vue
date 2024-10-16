<template>
  <div-table
    v-if="routine"
    selectable
    expandable
    :tableManagerProp="table"
    :key="routine.uuid"
    ref="workoutTable"
    :dialogTabs="[
      { key: 'setData', label: 'Set Data' },
      { key: 'repMaxes', label: 'Target Rep Maxes' },
      { key: 'notes', label: 'Notes' },
    ]"
  >
    <template v-slot:expand-section="props">
      <div-table
        :tableManagerProp="
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
        v-else-if="props.dialogTabSelected === 'repMaxes'"
        readonly
        :tableManagerProp=" (new TargetRepsTable((props.row as Workout)))"
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

      <div v-else-if="props.dialogTabSelected === 'notes'">
        <q-input
          v-model="(props.row as Workout).notes"
          :type="'textarea'"
          autogrow="true"
          inputClass="notes-section"
        />
      </div>

      <canvas
        ref="setGraph1"
        v-else-if="props.dialogTabSelected === 'setGraphs'"
      ></canvas>

      {{ setupCharts() }}
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
import Chart from 'chart.js/auto';
import 'chartjs-adapter-luxon';

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
      curentTargetRepTable: undefined as TargetRepsTable | undefined,
      chart1: undefined as Chart<any, any, any> | undefined,
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

    setupCharts() {
      this.$nextTick(() => {
        const graphRef = this.$refs['setGraph1'];
        if (graphRef) {
          const config: any = {
            type: 'line',

            data: {
              datasets: [
                {
                  label: 'Calories',

                  data:
                    this.currentWorkoutSetTable?.getData().map((d) => ({
                      y: d.getEnergyEstimate().value,
                      x: d.recordTimestamp,
                    })) ?? [],
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                  ],
                  borderWidth: 1,
                },
              ],
            },
            options: {
              scales: {
                x: {
                  type: 'time',
                  time: {
                    // Luxon format string
                    tooltipFormat: 'DD T',
                  },
                  title: {
                    display: true,
                    text: 'Date',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Calories',
                  },
                },
              },
            },
          };
          const chartConstructor = Chart as unknown as {
            new (graphRef: any, config: any): Chart;
          };
          this.chart1 = new chartConstructor(graphRef, config);
        }
      });
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
    const tableManager = this.$refs.workoutTable as typeof DivTable;

    tableManager?.onDialogClose(() => {
      this.currentWorkoutSetTable?.clearEditModes();
      tableManager?.deselectRow();
    });
  },
});
</script>
