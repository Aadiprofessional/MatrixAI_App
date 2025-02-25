import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import java.util.List;
import com.matrixai.BuildConfig;
import com.facebook.react.PackageList;

public class MainApplication extends Application implements ReactApplication {
  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      packages.add(new VectorIconsPackage());
      return packages;
    }
  };
}
