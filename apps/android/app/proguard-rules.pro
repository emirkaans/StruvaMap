# Add project specific ProGuard rules here.

# Glance, widget düğmesinin ActionCallback'ini sınıf adıyla yansıma üzerinden
# oluşturuyor (bkz. pulse/widget/PulseWidget.kt PulseWidgetAnswerAction).
-keep class * implements androidx.glance.appwidget.action.ActionCallback { <init>(); }
