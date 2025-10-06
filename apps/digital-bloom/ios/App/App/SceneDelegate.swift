import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Required for iOS 26 - let UIKit create window from Main.storyboard automatically
        // The storyboard will instantiate CAPBridgeViewController as initial view controller
        guard let windowScene = (scene as? UIWindowScene) else { return }

        // Store the window reference (created by storyboard)
        self.window = windowScene.windows.first

        // Set black background for window to eliminate white bars on iOS
        self.window?.backgroundColor = .black

        // Also set for all windows in the scene
        for window in windowScene.windows {
            window.backgroundColor = .black
        }
    }

    func sceneDidDisconnect(_ scene: UIScene) {
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Ensure window background stays black
        self.window?.backgroundColor = .black
    }

    func sceneWillResignActive(_ scene: UIScene) {
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
    }
}
