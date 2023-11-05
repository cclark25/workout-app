package org.apache.cordova.plugin;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import androidx.activity.result.contract.ActivityResultContract;
import java.io.Console;
import java.io.OutputStream;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class FileManager extends CordovaPlugin {

  static int REQUEST_CODE = 90;
  CallbackContext callbackContext = null;
  String fileContents;

  @Override
  public boolean execute(
    String action,
    JSONArray args,
    CallbackContext callbackContext
  ) throws JSONException {
    this.callbackContext = callbackContext;
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
      this.fileContents = fileContents;
      Context activityContext =
        this.cordova.getActivity().getApplicationContext();
      Toast
        .makeText(
          activityContext,
          "Initiating file creation.",
          Toast.LENGTH_LONG
        )
        .show();

      Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);

      // will trigger exception if no  appropriate category passed
      intent.addCategory(Intent.CATEGORY_OPENABLE);
      // or whatever mimeType you want
      intent.setType("application/json");
      intent.putExtra(Intent.EXTRA_TITLE, fileName);

      cordova.startActivityForResult(this, intent, FileManager.REQUEST_CODE);
      // PluginResult r = new PluginResult(PluginResult.Status.NO_RESULT);
      // r.setKeepCallback(true);
      // callbackContext.sendPluginResult(r);
    } else {
      callbackContext.error("Expected a filename.");
    }
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    Context activityContext =
      this.cordova.getActivity().getApplicationContext();
    Toast.makeText(
      activityContext,
      "onActivityResult called: " + requestCode,
      Toast.LENGTH_LONG
    );

    String message =
      "onActivityResult callback: requestCode:" +
      requestCode +
      " resultCode:" +
      resultCode +
      " intent:" +
      ((data != null) ? "true" : "false");

    System.out.println(message);

    if (resultCode == Activity.RESULT_OK) {
      try {
        OutputStream fileOutupStream = activityContext
          .getContentResolver()
          .openOutputStream(data.getData());

        fileOutupStream.write(this.fileContents.getBytes());
        fileOutupStream.flush();
        fileOutupStream.close();
        Toast.makeText(activityContext, "saved file", Toast.LENGTH_LONG).show();
        this.callbackContext.sendPluginResult(
            new PluginResult(PluginResult.Status.OK, "Success")
          );
      } catch (Exception e) {
        Toast
          .makeText(
            activityContext,
            "something went wrong" + e.getMessage(),
            Toast.LENGTH_SHORT
          )
          .show();
        e.printStackTrace();
        this.callbackContext.sendPluginResult(
            new PluginResult(
              PluginResult.Status.ERROR,
              "Failure: " + e.getMessage()
            )
          );
      }
    }
  }
}
