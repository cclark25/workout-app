<template>
  <canvas
    class="graph-canvas"
    v-for="graph in graphs"
    :ref="graph.key"
    :key="graph.key"
  ></canvas>
</template>

<script lang="ts">
import { Chart, ChartConfiguration, ChartTypeRegistry } from 'chart.js';
import { defineComponent, PropType } from 'vue';
import { RoutineNavigator } from 'src/lib/navigator';
import { DateTime } from 'luxon';

type MappedData = { x: DateTime; y: number };

class Graph<DataElement> {
  public constructor(
    public key: string,
    public label: string,
    public xAxisLabel: string,
    public yAxisLabel: string,
    public getData: () => DataElement[],
    public mapData: (d: DataElement) => MappedData
  ) {}

  public chart?: Chart<any, any, any>;

  public initializeChart(graphRef: HTMLCanvasElement) {
    this.chart?.destroy();
    const config: ChartConfiguration<
      keyof ChartTypeRegistry,
      MappedData[],
      unknown
    > = {
      type: 'line',

      data: {
        datasets: [
          {
            label: this.label,
            data: this.getData().map((d) => this.mapData(d)),
            pointRadius: 1,
            backgroundColor: '#0099ff80',
            pointBackgroundColor: 'blue',
            showLine: false,
            fill: true,
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
              text: this.xAxisLabel,
            },
          },
          y: {
            title: {
              display: true,
              text: this.yAxisLabel,
            },
          },
        },
      },
    };
    this.chart = new Chart<any, any, any>(graphRef, config);
  }
}

const calorieGraph = new Graph(
  'calorieGraph',
  'Calories',
  'Date',
  'Calories',
  () => RoutineNavigator.getSelectedRoutine()?.workouts ?? [],
  (r) => {
    const result = {
      y: r.totalCalories.value,
      x: r.getLatestTimestamp() ?? DateTime.fromMillis(0),
    };
    return result;
  }
);
const oneRepMaxGraph = new Graph(
  'oneRepMaxGraph',
  '1 Rep Max',
  'Date',
  '1RM (lbs)',
  () => RoutineNavigator.getSelectedRoutine()?.workouts ?? [],
  (r) => {
    const result = {
      y: r.calculateOneRepMax(),
      x: r.getLatestTimestamp() ?? DateTime.fromMillis(0),
    };
    return result;
  }
);

export default defineComponent({
  name: 'MainGraphs',
  data() {
    const data = {
      graphs: [calorieGraph, oneRepMaxGraph],
    };
    this;
    return data;
  },
  mounted() {
    this.setupCharts();
    RoutineNavigator.onSelectedChange(() => {
      this.setupCharts();
      this.$forceUpdate();
    });
  },

  methods: {
    setupCharts() {
      for (const chart of this.graphs) {
        const chartRef = this.$refs[chart.key] as HTMLCanvasElement | undefined;
        if (chartRef) {
          chart.initializeChart(chartRef);
        }
      }
    },
  },
  setup() {
    return {};
  },
});
</script>
