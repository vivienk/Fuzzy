package com.fuzzy.christmas.model

import java.net.URLEncoder

private fun emailField(value: String) = URLEncoder.encode(value, "UTF-8").replace("+", "%20")

internal fun parcelEmail(recipient: String, parcel: String): String {
    val subject = emailField("A winter world for you")
    val body = emailField("I packed a winter world with three gifts for you.\n\n$parcel")
    return "mailto:${emailField(recipient).replace("%40", "@")}?subject=$subject&body=$body"
}
