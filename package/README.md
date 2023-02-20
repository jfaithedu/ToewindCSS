<img src="./toewavecss-logo-header.png" width="100%"></img>

# Welcome to ToewaveCSS

ToewaveCSS is the ultimate solution for developers and designers who want to take their TailwindCSS game to the next level. With ToewaveCSS, you can write custom utilities, components, and base classes anywhere in your CSS and use them with ease. Whether you're a seasoned pro or a beginner, ToewaveCSS makes it easy to unleash your creativity and streamline your workflow.

## Installation

To install ToewaveCSS, you must have a TailwindCSS installation already set up. To install the plugin, simply run the following command:

```shell
$ npm install toewavecss
```

Once installed, add the plugin to your Tailwind config file, and specify your source directory (default is './').

To do this, add the following line to your tailwind.config.js file:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // (...)
  plugins: [
    // (...),
    require("./toewave.js"),
  ],
  toewave: {
    cssPath: "./src/styles",
  },
};
```

## Using ToewaveCSS

To use ToewaveCSS, you must wrap your custom classes in the @twlayer directive, with the associated name (base, utilities, or components). The @twlayer directive has the same functionality, syntax, and function as tailwindcss @layer directive.

For example, you could use the following code:

```css
@twlayer base {
  .custom-h1: {
    @apply text-4xl;
    color: "blue";
  }
}
@twlayer components {
  .custom-button: {
    @apply rounded-none;
    color: #fff;
  }
}
@twlayer utilities {
  .custom-gradient: {
    @apply from-blue-200 via-red-100 to-white;
  }
}
```
