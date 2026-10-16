const { withGradleProperties } = require("expo/config-plugins");

const KEY = "org.gradle.jvmargs";

// Release builds run extra analysis (KSP, lint) that needs more metaspace than
// the generated default of 512 MB. Setting it here, instead of editing the
// generated android/gradle.properties, survives `expo prebuild --clean`.
const VALUE = "-Xmx4096m -XX:MaxMetaspaceSize=1024m";

/** @type {import("expo/config-plugins").ConfigPlugin} */
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (modConfig) => {
    const properties = modConfig.modResults;
    const existing = properties.find(
      (item) => item.type === "property" && item.key === KEY,
    );

    if (existing) {
      existing.value = VALUE;
    } else {
      properties.push({ type: "property", key: KEY, value: VALUE });
    }

    return modConfig;
  });
};
