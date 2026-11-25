package com.fuzzy.christmas.content

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

private const val ENDPOINT = "https://fuzzy-preview-git-feat-tripo-w-af628c-viviens-projects-842ec178.vercel.app/api/tripo"

private fun connect(query: String): HttpURLConnection =
    (URL(ENDPOINT + query).openConnection() as HttpURLConnection).apply {
        connectTimeout = 15000
        readTimeout = 60000
    }

private suspend fun task(query: String, body: JSONObject? = null): JSONObject = withContext(Dispatchers.IO) {
    val connection = connect(query)
    try {
        if (body != null) {
            connection.requestMethod = "POST"
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
        }
        check(connection.responseCode in 200..299) { "Gift service returned HTTP ${connection.responseCode}." }
        connection.inputStream.bufferedReader().use { JSONObject(it.readText()) }
    } finally { connection.disconnect() }
}

internal suspend fun startGift(prompt: String): String {
    require(prompt.trim().length in 3..500)
    return UUID.fromString(task("", JSONObject().put("operation","object").put("prompt",prompt.trim())).getString("taskId")).toString()
}

internal suspend fun awaitGift(id: String, progress: (Int?) -> Unit) {
    val key = UUID.fromString(id).toString()
    repeat(180) {
        val result = task("?taskId=$key")
        when (result.optString("status")) {
            "success" -> return
            "failed", "expired", "banned", "cancelled" -> error("Generation ended. Choose another gift or try again.")
        }
        progress(result.optInt("progress", -1).takeIf { it >= 0 }?.coerceAtMost(99))
        delay(3000)
    }
    error("Still generating. Retry to check the same gift.")
}

internal suspend fun giftFile(context: Context, id: String): File = withContext(Dispatchers.IO) {
    val key = UUID.fromString(id).toString()
    val directory = File(context.cacheDir,"gift-models").apply { mkdirs() }
    val target = File(directory,"$key.glb")
    if (target.isFile) return@withContext target
    val temporary = File.createTempFile("gift-", ".part",directory)
    val connection = connect("?download=1&asset=object&taskId=$key")
    try {
        check(connection.responseCode in 200..299) { "Could not download this gift." }
        connection.inputStream.use { input -> temporary.outputStream().use { output ->
            val buffer=ByteArray(32768)
            var size=0L
            while (true) {
                val count=input.read(buffer)
                if (count < 0) break
                size+=count
                check(size <= 48L*1024*1024) { "This model exceeds the download limit." }
                output.write(buffer,0,count)
            }
        } }
        temporary.inputStream().use { check(java.io.DataInputStream(it).readInt()==0x676c5446) { "Expected a GLB model." } }
        check(temporary.renameTo(target) || target.isFile)
        target
    } finally { connection.disconnect(); temporary.delete() }
}
