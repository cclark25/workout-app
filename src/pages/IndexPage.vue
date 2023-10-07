<template>
  <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
    <div-table
      :tableManagerProp="routineTable"
      :row-selected="
        () => {
          leftDrawerOpen = false;
        }
      "
      selectable
      ref="routine-table"
    ></div-table>
  </q-drawer>

  <div class="main-page">
    <div class="navigation-bar">
      <div class="navigation-actions">
        <q-btn flat icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        {{ RoutineNavigator.getSelectedRoutine()?.getDisplayName() }}
      </div>

      <q-tabs
        class="navigation-tabs"
        align="left"
        v-model="tabSelected"
        active-bg-color="grey-4"
      >
        <q-tab key="data" label="Data" name="data" />
        <q-tab key="graphs" label="Graphs" name="graphs" />
      </q-tabs>

      <q-btn
        flat
        icon="upload_file"
        aria-label="Upload File"
        @click="openFileDialog"
      />

      <input
        ref="fileInput"
        style="display: none"
        type="file"
        accept=".json"
        @change="loadFile"
      />
    </div>
    <div v-if="tabSelected === 'data'" class="main-body">
      <workouts-table
        :routine="RoutineNavigator.getSelectedRoutine()"
        :key="RoutineNavigator.selectedRoutine?.uuid"
      ></workouts-table>
    </div>
    <main-graphs v-else-if="(tabSelected = 'graphs')"></main-graphs>
  </div>
</template>

<script lang="ts">
import WorkoutsTable from 'components/WorkoutTable.vue';
import { defineComponent, ref } from 'vue';
import { RoutineNavigator } from 'src/lib/navigator';
import { WorkoutSetTable } from '../components/data/ui-tables/workout-set-table';
import { Routine, RoutineSerial } from 'src/components/data/routine';
import { RoutineTable } from '../components/data/ui-tables/routine-table';
import { AppData } from 'src/components/data/data-manager';
import DivTable from 'components/DivTable.vue';
import MainGraphs from 'components/MainGraphs.vue';
import { RoutineSerializer } from 'components/data/routine';

export default defineComponent({
  name: 'IndexPage',
  components: {
    WorkoutsTable,
    DivTable,
    MainGraphs,
  },

  data() {
    return {
      routineChanged: 0,
      routineTable: new RoutineTable({
        get routines() {
          return AppData.singleton.routines;
        },
        set routines(routines: Routine[]) {
          AppData.singleton.routines = routines;
        },
      }),
      tabSelected: 'data' as 'data' | 'graphs',
    };
  },
  methods: {
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },
    async loadFile(input: any) {
      const routines: Routine[] = (
        JSON.parse(await input.target.files[0].text()) as RoutineSerial[]
      ).map((r) => new RoutineSerializer().deserialize(r));
      AppData.singleton.routines.push(...routines);
    },
    openFileDialog() {
      (this.$refs.fileInput as any).click();
    },
  },

  mounted() {
    RoutineNavigator.onSelectedChange(() => {
      this.routineChanged++;
      this.$forceUpdate();
    });
    const routineTableRef = this.$refs['routine-table'] as any;
    routineTableRef?.selectRow?.(RoutineNavigator.getSelectedRoutine());
  },

  setup() {
    const leftDrawerOpen = ref(false);
    return {
      WorkoutSetTable,
      RoutineNavigator,

      leftDrawerOpen,
    };
  },
});
</script>
