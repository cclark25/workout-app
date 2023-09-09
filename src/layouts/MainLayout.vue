<template>
  <q-dialog
    maximized
    :model-value="routineSettingsDialogVisible"
    @hide="dialogHidden()"
  >
    <div class="dialog">
      <q-btn
        class="dialog-close-div"
        flat
        icon="close"
        @click="routineSettingsDialogVisible = false"
      ></q-btn>

      <div class="dialog-body">
        <span style="display: inline-block"
          >Routine Name:
          <input
            type="text"
            v-model="RoutineNavigator.getSelectedRoutine()!.name"
        /></span>
      </div>
    </div>
  </q-dialog>

  <q-layout view="lHh Lpr lFf" :refresh="routineSettingsDialogVisible">
    <router-view />
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { AppData } from 'src/components/data/data-manager';
import { RoutineNavigator } from 'src/lib/navigator';

export default defineComponent({
  name: 'MainLayout',

  components: {},
  data() {
    return {
      routineSettingsDialogVisible: false,
    };
  },
  methods: {
    dialogHidden() {
      this.routineSettingsDialogVisible = false;
      AppData.singleton.save();
    },
  },

  setup() {
    return {
      RoutineNavigator,
      AppData,
    };
  },
});
</script>
