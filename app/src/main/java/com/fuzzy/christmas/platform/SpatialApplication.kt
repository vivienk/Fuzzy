package com.fuzzy.christmas.platform

import android.app.Application
import com.pico.spatial.ui.foundation.dsl.launch
import com.fuzzy.christmas.mainApp

class SpatialApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        launch(::mainApp)
    }
}
