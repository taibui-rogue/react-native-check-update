package vn.rogue.rn.checkupdate;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class CheckUpdateModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public CheckUpdateModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Nonnull
    @Override
    public String getName() {
        return "CheckUpdate";
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        Map<String, Object> constants = new HashMap<>();

        PackageManager packageManager = reactContext.getPackageManager();
        String packageName = reactContext.getPackageName();
        constants.put("packageName", packageName);
        try {
            PackageInfo info = packageManager.getPackageInfo(packageName, 0);
            constants.put("currentVersion", info.versionName);
            constants.put("currentBuild", info.versionCode);
        } catch (PackageManager.NameNotFoundException e) {
            constants.put("currentVersion", null);
            constants.put("currentBuild", null);
        }

        return constants;
    }
}
