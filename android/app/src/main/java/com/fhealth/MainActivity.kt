package com.fhealth

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView
import com.facebook.react.ReactRootView

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "FHealth"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    object : DefaultReactActivityDelegate(
      this,
      mainComponentName,
      fabricEnabled
    ) {
      override fun createRootView(): ReactRootView {
        return RNGestureHandlerEnabledRootView(this@MainActivity)
      }
    }
}
