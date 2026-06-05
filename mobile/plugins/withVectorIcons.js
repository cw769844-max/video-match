// Copies Ionicons font into the Android assets folder during expo prebuild
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withVectorIcons(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const fontsSource = path.resolve(
        config.modRequest.projectRoot,
        'node_modules/react-native-vector-icons/Fonts',
      );
      const fontsDest = path.resolve(
        config.modRequest.platformProjectRoot,
        'app/src/main/assets/fonts',
      );

      if (!fs.existsSync(fontsDest)) {
        fs.mkdirSync(fontsDest, { recursive: true });
      }

      const iconFonts = ['Ionicons.ttf', 'MaterialIcons.ttf', 'FontAwesome.ttf'];
      iconFonts.forEach((font) => {
        const src = path.join(fontsSource, font);
        const dest = path.join(fontsDest, font);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      });

      return config;
    },
  ]);
};
