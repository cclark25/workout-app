package org.apache.cordova.plugin;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class FileManager extends CordovaPlugin {

  @Override
  public boolean execute(
    String action,
    JSONArray args,
    CallbackContext callbackContext
  ) throws JSONException {
    if (action.equals("createFile")) {
      String fileName = args.getString(0);
      String fileContents = args.getString(1);
      this.createFile(fileName, fileContents, callbackContext);
      return true;
    }
    return false;
  }

  private void createFile(
    String message,
    String fileContents,
    CallbackContext callbackContext
  ) {
    if (message != null && message.length() > 0) {
      callbackContext.success(message);
    } else {
      callbackContext.error("Expected a filename.");
    }
  }
}
