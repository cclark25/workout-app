npx quasar build --mode cordova -T android
cd dist/cordova/android/bundle/release
java -jar ~/Downloads/bundletool-all-1.15.4.jar build-apks --bundle=app-release.aab --output=app.apks
java -jar ~/Downloads/bundletool-all-1.15.4.jar install-apks --apks=app.apks