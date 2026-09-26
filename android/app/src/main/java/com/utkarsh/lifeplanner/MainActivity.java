package com.utkarsh.lifeplanner;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {

    public static final String ALARM_CHANNEL_ID = "life-planner-task-alarms-v2";
    public static final String LEGACY_ALARM_CHANNEL_ID = "life-planner-task-alarms";
    public static final String NOTIF_CHANNEL_ID = "life-planner-task-notifications";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmHelperPlugin.class);
        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // Delete legacy channel so previous incorrect volume/stream settings don't persist
            try {
                manager.deleteNotificationChannel(LEGACY_ALARM_CHANNEL_ID);
            } catch (Exception ignored) {}

            // 1. HIGH-PRIORITY ALARM CHANNEL (STREAM_ALARM)
            // USAGE_ALARM binds this channel strictly to the device's ALARM Volume slider,
            // allowing alarms to sound at full alarm volume even when phone is on silent/vibrate!
            Uri alarmSoundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/alarm");

            AudioAttributes alarmAudioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                .build();

            NotificationChannel alarmChannel = new NotificationChannel(
                ALARM_CHANNEL_ID,
                "Task Alarms (Loud)",
                NotificationManager.IMPORTANCE_HIGH
            );
            alarmChannel.setDescription("Loud task alarms that ring at Alarm Volume even when app is closed or phone is on silent");
            alarmChannel.setSound(alarmSoundUri, alarmAudioAttributes);
            alarmChannel.setBypassDnd(true);
            alarmChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            alarmChannel.enableVibration(true);
            alarmChannel.setVibrationPattern(new long[]{0, 600, 250, 600, 250, 600});
            alarmChannel.enableLights(true);
            alarmChannel.setLightColor(0xFF7C3AED);

            manager.createNotificationChannel(alarmChannel);

            // 2. STANDARD NOTIFICATION CHANNEL (STREAM_NOTIFICATION)
            NotificationChannel notifChannel = new NotificationChannel(
                NOTIF_CHANNEL_ID,
                "Task Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            notifChannel.setDescription("Timetable task reminder notification banners");
            notifChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            notifChannel.enableVibration(true);
            manager.createNotificationChannel(notifChannel);
        }
    }

    @CapacitorPlugin(name = "AlarmHelper")
    public static class AlarmHelperPlugin extends Plugin {

        @PluginMethod
        public void checkExactAlarmStatus(PluginCall call) {
            Context ctx = getContext();
            JSObject ret = new JSObject();

            boolean canExact = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                android.app.AlarmManager am = (android.app.AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
                canExact = am != null && am.canScheduleExactAlarms();
            }

            boolean isIgnoringBattery = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
                isIgnoringBattery = pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
            }

            ret.put("canScheduleExactAlarms", canExact);
            ret.put("isIgnoringBatteryOptimizations", isIgnoringBattery);
            call.resolve(ret);
        }

        @PluginMethod
        public void requestExactAlarmPermission(PluginCall call) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        }

        @PluginMethod
        public void requestBatteryOptimizationExemption(PluginCall call) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getContext().getPackageName())) {
                    try {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(intent);
                    } catch (Exception e) {
                        // Fallback to app details settings
                        Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        fallback.setData(Uri.parse("package:" + getContext().getPackageName()));
                        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(fallback);
                    }
                }
            }
            call.resolve();
        }
    }
}
