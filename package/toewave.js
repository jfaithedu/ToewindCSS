// Require necessary modules
const plugin = require("tailwindcss/plugin");
const fs = require("fs");
const path = require("path");

// Set up default configuration
const defaultConfig = {
  cssPath: "./",
};

// Load configuration from the tailwind.config.js file
function getConfigFilePath() {
  return path.join(process.cwd(), "tailwind.config");
}

// this is depreciated
/* function createConfigFile() {
  const configString = `module.exports = ${JSON.stringify(
    defaultConfig,
    null,
    2
  )}`;
  const configFilePath = getConfigFilePath();
  fs.writeFileSync(`${configFilePath}`, configString);
  return defaultConfig;
} */

// Load configuration from the tailwind.config file
function loadConfig() {
  let configFile;
  const configFilePath = getConfigFilePath();
  try {
    const _configFile = require(configFilePath);
    configFile = _configFile?.toewave || defaultConfig;
  } catch (error) {
    configFile = defaultConfig;
  }

  return configFile;
}

// specific patterns for each layer
const LAYER_BASE_PATTERN =
  /^@twlayer\s+(base)\s*\{[\s\S]*?^}(?=\s*@twlayer|$)(?!(\s\*\/))(?<!(\s\/\*))/gm;
const LAYER_COMPONENTS_PATTERN =
  /^@twlayer\s+(components)\s*\{[\s\S]*?^}(?=\s*@twlayer|$)(?!(\s\*\/))(?<!(\s\/\*))/gm;
const LAYER_UTILITIES_PATTERN =
  /^@twlayer\s+(utilities)\s*\{[\s\S]*?^}(?=\s*@twlayer|$)(?!(\s\*\/))(?<!(\s\/\*))/gm;

// CLASS_OBJECT_PATTERN matches '.className { ... }' patterns
const CSS_CLASS_OBJECT_PATTERN = /\.([\w-]+)\s*{\s*([\s\S]*?)\s*}/gm;
// CLASS_DECLARATION_PATTERN matches 'property: value;' patterns
const CSS_CLASS_DECLARATION_PATTERN =
  /(?<=;\s*|{\s*)([\w-]+)\s*:\s*([\*\#\d\(\)\w-]+)\s*;/gm;
// TW_APPLY_PATTERN matches '@apply' patterns
const TW_APPLY_PATTERN = /@apply\s+([\:\[\]\(\)\-\d\w\s-]+)\s*;/gm;
const newLineRegex = /\n/gm;
const newLineReplacement = "";

// parse the contents of a single css file
function parseCSSFileContents(cssFileContents) {
  //

  const cssFileContentsString = cssFileContents;

  const processClassString = (classString) => {
    const className = classString.match(/\.([\w-]+)/)[1];
    const applyDeclarations = classString.match(TW_APPLY_PATTERN);

    const classDeclarations = classString.match(CSS_CLASS_DECLARATION_PATTERN);

    if (!classDeclarations && !applyDeclarations) return {};

    const classObject = {};

    if (applyDeclarations?.map) {
      applyDeclarations.map((applyDeclaration) => {
        classObject[applyDeclaration.replace(";", "").trim()] = {};
      });
    }
    if (classDeclarations?.map) {
      classDeclarations.map((classDeclaration) => {
        const [property, value] = classDeclaration.split(":");
        classObject[property.trim()] = value.replace(";", "").trim();
      });
    }

    return { [`.${className}`]: classObject };
  };

  const baseLayer = (
    cssFileContentsString.match(LAYER_BASE_PATTERN) || []
  ).join("");
  const componentsLayer = (
    cssFileContentsString.match(LAYER_COMPONENTS_PATTERN) || []
  ).join("");
  const utilitiesLayer = (
    cssFileContentsString.match(LAYER_UTILITIES_PATTERN) || []
  ).join("");

  const classesByLayer = {
    base: (baseLayer.match(CSS_CLASS_OBJECT_PATTERN) || []).map(
      (cssClassObject) =>
        cssClassObject.replace(newLineRegex, newLineReplacement)
    ),
    components: (componentsLayer.match(CSS_CLASS_OBJECT_PATTERN) || []).map(
      (cssClassObject) =>
        cssClassObject.replace(newLineRegex, newLineReplacement)
    ),
    utilities: (utilitiesLayer.match(CSS_CLASS_OBJECT_PATTERN) || []).map(
      (cssClassObject) =>
        cssClassObject.replace(newLineRegex, newLineReplacement)
    ),
  };

  const returnObject = {
    base: Object.assign(
      {},
      ...classesByLayer.base.map((classString) => {
        console.log("base.map=>\n", classString);
        return processClassString(classString);
      })
    ),
    components: Object.assign(
      {},
      ...classesByLayer.components.map((classString) =>
        processClassString(classString)
      )
    ),
    utilities: Object.assign(
      {},
      ...classesByLayer.utilities.map((classString) =>
        processClassString(classString)
      )
    ),
  };

  return returnObject;
}

// parse the contents of a directory of css files
function parseCSSDirectory(directoryPath) {
  const cssDirectory = path.resolve(directoryPath);
  const cssFiles = fs.readdirSync(cssDirectory);
  const parsedCSS = { base: {}, components: {}, utilities: {} };
  cssFiles.forEach((file) => {
    const filePath = path.resolve(cssDirectory, file);
    if (fs.statSync(filePath).isDirectory()) {
      const subdirectoryParsedCSS = parseCSSDirectory(filePath);
      parsedCSS.base = Object.assign(
        {},
        parsedCSS.base,
        subdirectoryParsedCSS.base
      );
      parsedCSS.components = Object.assign(
        {},
        parsedCSS.components,
        subdirectoryParsedCSS.components
      );
      parsedCSS.utilities = Object.assign(
        {},
        parsedCSS.utilities,
        subdirectoryParsedCSS.utilities
      );
    } else if (file.endsWith(".css")) {
      console.log("Parsing File", filePath);
      const cssFileContents = fs.readFileSync(filePath, "utf8");
      const parsedCSSFile = parseCSSFileContents(cssFileContents);

      if (parsedCSSFile.base) {
        parsedCSS.base = Object.assign({}, parsedCSS.base, parsedCSSFile.base);
      }

      if (parsedCSSFile.components) {
        parsedCSS.components = Object.assign(
          {},
          parsedCSS.components,
          parsedCSSFile.components
        );
      }

      if (parsedCSSFile.utilities) {
        parsedCSS.utilities = Object.assign(
          {},
          parsedCSS.utilities,
          parsedCSSFile.utilities
        );
      }
    }
  });

  return parsedCSS;
}

module.exports = plugin.withOptions(() => {
  const config = loadConfig();
  const { base, components, utilities } = parseCSSDirectory(config.cssPath);
  console.log("parsedCSS", base, components, utilities);
  return function ({ addBase, addUtilities, addComponents }) {
    if (components) addComponents(components);
    if (utilities) addUtilities(utilities);
    if (base) addBase(base);
  };
});
