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
        <q-tab key="debug" label="Debug" name="debug"></q-tab>
      </q-tabs>

      <q-btn-dropdown flat label="File">
        <q-list>
          <q-item>
            <q-item-section>
              <q-item-label @click="openFileDialog">Load File</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label @click="saveFile">Save File</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <input
        ref="fileInput"
        style="display: none"
        type="file"
        accept=".json"
        @change="loadFile"
      />
      <!-- <input
        type="file"
        id="ctrl"
        webkitdirectory
        directory
        multiple
        text="Abc"
      /> -->
    </div>
    <div v-if="tabSelected === 'data'" class="main-body">
      <workouts-table
        :routine="RoutineNavigator.getSelectedRoutine()"
        :key="RoutineNavigator.selectedRoutine?.uuid"
      ></workouts-table>
    </div>
    <main-graphs v-else-if="tabSelected === 'graphs'"></main-graphs>
    <div v-else-if="tabSelected === 'debug'">
      <textarea v-text="debugMsg" style="width: 100%; height: 100vh"></textarea>
    </div>
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
import { DataSerial } from 'src/components/data/data-manager';
import { DateTime } from 'luxon';
import { exportFile } from 'quasar';
import { resolveLocalFileSystemURI } from 'app/src-cordova/platforms/android/platform_www/plugins/cordova-plugin-file/www/resolveLocalFileSystemURI';
import { json } from 'stream/consumers';

// let i = 0;
// crypto.randomUUID = () => `${i++}-${i++}-${i++}-${i++}-${i++}`;
// declare const LocalFileSystem: any;

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
      downloadAllowed: undefined as any,
      debugMsg: '',
    };
  },
  methods: {
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },
    async loadFile(input: any) {
      const serializedData: DataSerial = JSON.parse(
        await input.target.files[0].text()
      );
      const routines: Routine[] = serializedData.routines.map((r) =>
        new RoutineSerializer().deserialize(r)
      );
      AppData.singleton.mergeData(routines);
      AppData.singleton.save();
    },
    openFileDialog() {
      (this.$refs.fileInput as any).click();
    },
    async saveFile() {
      AppData.singleton.save();

      // new FileReader().readAsTex;
      // const directory =
      //   ((cordova as unknown as { file: Record<string, string> }).file
      //     .externalRootDirectory ??
      //     (cordova as unknown as { file: Record<string, string> }).file
      //       .dataDirectory) + 'Download/test';

      console.log = (...msgs: any[]) => {
        this.debugMsg += `\n>${msgs.join(' ')}`;
      };
      // console.log(JSON.stringify(AppData.singleton.serialize()));

      console.log(
        'File manager result: ',
        await (window as any).FileManager.createFile(
          'filename.txt',
          'file contents'
        )
      );
      return;

      // console.log(
      //   'file locations: ',
      //   JSON.stringify(
      //     (cordova as unknown as { file: Record<string, string> }).file,
      //     undefined,
      //     ' '
      //   )
      // );
      // console.log('directory: ', directory);

      // window.resolveLocalFileSystemURL(
      //   directory,
      //   function (this: any, f: Entry) {
      //     console.log('file success: ', f.fullPath);
      //     console.log('file success: ', f);
      //     console.log('file success: ', JSON.stringify(f));
      //   }.bind(this),
      //   (f) => {
      //     console.log('file error', f);
      //   }
      // );

      // const fileSystem = window.requestFileSystem(
      //   1,
      //   1024,
      //   function (this: any, fs: FileSystem) {
      //     console.log('fs:', fs);
      //     fs.root.getDirectory(
      //       directory,
      //       undefined,
      //       (d) => {
      //         console.log('directory success:', d);
      //       },
      //       (e) => {
      //         console.log('directory fail:', JSON.stringify(e as DOMException));
      //       }
      //     );

      //     // this.cordova = fileSystem;
      //   }.bind(this)
      // );

      // return;

      // var textToWrite = JSON.stringify(AppData.singleton.serialize());

      // var textFileAsBlob = new Blob([textToWrite], { type: 'text/json' });
      // var fileNameToSaveAs = `workout-data-${DateTime.now().toFormat(
      //   'yyyyMMdd_hhmmss'
      // )}.json`; //filename.extension

      // const allowed = exportFile(fileNameToSaveAs, textToWrite, {
      //   mimeType: 'text/json',
      // });
      // this.downloadAllowed = allowed;
      // console.log('exportFile: ', allowed);

      // // var downloadLink = document.createElement('a');
      // // downloadLink.download = fileNameToSaveAs;
      // // downloadLink.innerHTML = 'Download File';
      // // if (window.webkitURL != null) {
      // //   // Chrome allows the link to be clicked without actually adding it to the DOM.
      // //   downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
      // // } else {
      // //   // Firefox requires the link to be added to the DOM before it can be clicked.
      // //   downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
      // //   // downloadLink.onclick = (event) =>
      // //   //   event.target ? document.body.removeChild(event.target) : undefined;
      // //   downloadLink.style.display = 'none';
      // //   document.body.appendChild(downloadLink);
      // // }

      // // downloadLink.click();
    },
  },

  mounted() {
    RoutineNavigator.onSelectedChange(() => {
      this.routineChanged++;
      this.$forceUpdate();
    });
    const routineTableRef = this.$refs['routine-table'] as any;
    const routineToSelect = RoutineNavigator.getSelectedRoutine();
    if (routineToSelect) {
      routineTableRef?.selectRow?.(routineToSelect);
    }
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
