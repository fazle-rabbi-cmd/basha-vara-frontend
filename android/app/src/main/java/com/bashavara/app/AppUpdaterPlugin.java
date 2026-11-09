package com.bashavara.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName", "basha-vara-update.apk");
        fileName = fileName.replaceAll("[^A-Za-z0-9._-]", "_");
        fileName = System.currentTimeMillis() + "-" + fileName;

        if (url == null || !url.startsWith("https://")) {
            call.reject("A secure APK URL is required.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())
            );
            getActivity().startActivity(settingsIntent);
            call.reject("INSTALL_PERMISSION_REQUIRED");
            return;
        }

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle("Basha Vara update");
        request.setDescription("Downloading the latest version");
        request.setMimeType("application/vnd.android.package-archive");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(false);
        request.setDestinationInExternalFilesDir(
                getContext(),
                Environment.DIRECTORY_DOWNLOADS,
                fileName
        );

        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        long downloadId = manager.enqueue(request);

        JSObject result = new JSObject();
        result.put("downloadId", downloadId);
        call.resolve(result);
        waitForDownload(manager, downloadId, 0);
    }

    private void waitForDownload(
            DownloadManager manager,
            long downloadId,
            int attempts
    ) {
        if (attempts > 600) {
            return;
        }

        handler.postDelayed(() -> {
            DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
            try (android.database.Cursor cursor = manager.query(query)) {
                if (!cursor.moveToFirst()) {
                    return;
                }

                int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                if (status == DownloadManager.STATUS_RUNNING || status == DownloadManager.STATUS_PENDING) {
                    long downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(
                            DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR
                    ));
                    long total = cursor.getLong(cursor.getColumnIndexOrThrow(
                            DownloadManager.COLUMN_TOTAL_SIZE_BYTES
                    ));
                    JSObject progress = new JSObject();
                    progress.put("progress", total > 0 ? Math.min(99, (int) (downloaded * 100 / total)) : 0);
                    notifyListeners("downloadProgress", progress);
                }

                if (status == DownloadManager.STATUS_SUCCESSFUL) {
                    Uri apkUri = manager.getUriForDownloadedFile(downloadId);
                    if (apkUri != null) {
                        notifyListeners("downloadComplete", new JSObject());
                        try {
                            launchInstaller(apkUri);
                        } catch (Exception error) {
                            notifyDownloadError("Android could not open the package installer. Try opening the download notification.");
                        }
                    } else {
                        notifyDownloadError("The downloaded update could not be opened.");
                    }
                    return;
                }

                if (status == DownloadManager.STATUS_FAILED) {
                    int reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                    notifyDownloadError("Update download failed (" + reason + "). Check your connection and try again.");
                    return;
                }
            }
            waitForDownload(manager, downloadId, attempts + 1);
        }, 1000);
    }

    private void launchInstaller(Uri apkUri) {
        Intent installIntent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
        installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        getActivity().startActivity(installIntent);
    }

    private void notifyDownloadError(String message) {
        JSObject error = new JSObject();
        error.put("message", message);
        notifyListeners("downloadError", error);
    }
}
