import React
import React_RCTAppDelegate
import UIKit

/// Owns the window and starts React Native in it. Also forwards deep links,
/// which scene-based apps receive here instead of in the AppDelegate.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let factory = (UIApplication.shared.delegate as? AppDelegate)?.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    factory.startReactNative(
      withModuleName: "Baseline",
      in: window,
      launchOptions: Self.launchOptions(from: connectionOptions)
    )
  }

  // Deep links while running: custom URL schemes.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
  }

  // Deep links while running: Universal Links (requires Associated Domains).
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }

  /// Cold-start links arrive in the connection options; translate them into the
  /// launch-options shape `Linking.getInitialURL()` reads.
  private static func launchOptions(
    from options: UIScene.ConnectionOptions
  ) -> [UIApplication.LaunchOptionsKey: Any] {
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url = options.urlContexts.first?.url {
      launchOptions[.url] = url
    }
    if let activity = options.userActivities.first(where: {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }) {
      launchOptions[.userActivityDictionary] = [
        "UIApplicationLaunchOptionsUserActivityKey": activity,
        UIApplication.LaunchOptionsKey.userActivityType: activity.activityType,
      ]
    }
    return launchOptions
  }
}
