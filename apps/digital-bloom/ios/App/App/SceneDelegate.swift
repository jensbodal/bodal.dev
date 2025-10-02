import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Required for iOS 26 - let UIKit create window from Main.storyboard automatically
        // The storyboard will instantiate CAPBridgeViewController as initial view controller
        guard let _ = (scene as? UIWindowScene) else { return }

        // Window is created automatically by UIKit from Main.storyboard
        // Just need to ensure the scene delegate exists
    }

    func sceneDidDisconnect(_ scene: UIScene) {
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
    }

    func sceneWillResignActive(_ scene: UIScene) {
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
    }
}
