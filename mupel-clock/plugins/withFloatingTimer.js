const { withAndroidManifest } = require('@expo/config-plugins');

const SERVICE_NAME = 'com.mupel.floatingtimer.FloatingOverlayService';

function ensureArray(obj, key) {
  if (!obj[key]) obj[key] = [];
  return obj[key];
}

function withFloatingTimer(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    const services = ensureArray(application, 'service');
    const alreadyRegistered = services.some(
      (s) => s?.$?.['android:name'] === SERVICE_NAME
    );

    if (!alreadyRegistered) {
      services.push({
        $: {
          'android:name': SERVICE_NAME,
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'floating-timer-overlay',
            },
          },
        ],
      });
    }

    return config;
  });
}

module.exports = withFloatingTimer;
