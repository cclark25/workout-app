<template>
  {{ onInit() }}

  <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
    <div-table
      :tableManager="routineTable"
      :row-selected="
        () => {
          leftDrawerOpen = false;
        }
      "
    ></div-table>
  </q-drawer>

  <div class="main-page">
    <div class="navigation-bar">
      <q-btn flat icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
      {{ RoutineNavigator.getSelectedRoutine()?.getDisplayName() }}
    </div>
    <div class="main-body">
      <workouts-table
        :routine="RoutineNavigator.getSelectedRoutine()"
        :key="RoutineNavigator.selectedRoutine?.uuid"
      ></workouts-table>
    </div>
  </div>
</template>

<script lang="ts">
import WorkoutsTable from 'components/WorkoutTable.vue';
import { defineComponent, ref } from 'vue';
import { RoutineNavigator } from 'src/lib/navigator';

import { WorkoutSetTable } from '../components/data/ui-tables/workout-set-table';
import { Routine } from 'src/components/data/routine';
import { RoutineTable } from '../components/data/ui-tables/routine-table';
import { AppData } from 'src/components/data/data-manager';
// import TableManager from 'components/Table.vue';
import DivTable from 'components/DivTable.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    WorkoutsTable,
    // TableManager,
    DivTable,
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
    };
  },
  methods: {
    onInit() {
      RoutineNavigator.onSelectedChange((r) => {
        this.routineChanged++;
        this.$forceUpdate();
        console.log('Routine changed');
      });
    },
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },
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
