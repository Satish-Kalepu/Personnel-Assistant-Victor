# Victor release shrinking rules (R8).

# Keep line numbers so release crash stack traces stay readable.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# AppAuth: the redirect receiver is referenced from the manifest, and the
# library restores auth state reflectively from JSON.
-keep class net.openid.appauth.** { *; }
-dontwarn net.openid.appauth.**

# OkHttp ships its own consumer rules; silence optional platform warnings.
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
