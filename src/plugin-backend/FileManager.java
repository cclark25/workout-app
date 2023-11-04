package org.apache.cordova.plugin;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.content.Intent;  


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
    String fileName,
    String fileContents,
    CallbackContext callbackContext
  ) {
    if (fileName != null && fileName.length() > 0) {
      Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);  

      // will trigger exception if no  appropriate category passed
      intent.addCategory(Intent.CATEGORY_OPENABLE);
      // or whatever mimeType you want
      intent.setType("*application/json");
      intent.putExtra(Intent.EXTRA_TITLE, fileName);
      startActivityForResult(intent, REQUEST_CODE_ARBITRARY);

      callbackContext.success('Filename passed into the plugin: ' + fileName);
    } else {
      callbackContext.error("Expected a filename.");
    }
  }
}
