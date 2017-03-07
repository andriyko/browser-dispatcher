[![Build Status](https://travis-ci.org/andriyko/browser-dispatcher.svg?branch=master)](https://travis-ci.org/andriyko/browser-dispatcher)

# Browser Dispatcher
*BrowserDispatcher.app* decides which browser to use when you click on a link outside of your web browser.
Based on your settings, it will display a prompt allowing you to select from a list of browsers or automatically select a browser to open a link with.

![BrowserDispatcher.app](http://i.imgur.com/bwjHlb5.png)

## Downloads
To download the latest release, see [releases page](https://github.com/andriyko/browser-dispatcher/releases) (macOS only).

**Note:** the application is not signed by Apple Developer ID.
By default, Mac OS will not open an app from an unidentified developer.

In the Finder, locate *BrowserDispatcher.app* and Control-click the app icon, then choose Open from the shortcut menu.
Make *BrowserDispatcher.app* default web browser. You can use the app menu `Preferences > Make default browser` or go to `System Preferences > General > Default web browser`.

The application is an agent app, that is, menu bar app that does not appear in the Dock or Force Quit window.

## Running from source
You'll need certain packages installed before you can build and run Browser Dispatcher locally.

### Prerequisites
1. `nodejs >= 6.2`

    Install from your package manager or download from https://nodejs.org

2. `npm install -g bower`

### Installation

After installing the prerequisites:

1. Clone the git repository from GitHub:
    ```
    git clone git@github.com:brave/browser-dispatcher.git
    ```

2. Open the working directory:
    ```
    cd browser-dispatcher
    ```
3. Install dependencies:

    ```
    npm install
    bower install
    ```

To start the application in development mode run `npm start` or `electron .`.

## Running the tests

Run unit and end-to-end tests:
```
nmp test
```

Run unit tests only:
```
npm run test:unit
```

Run end-to-end tests only:
```
npm run test:e2e
```


## Building the application

Build without code-signing:
```
npm run dist-unsigned
```

Build and code-sign:
```
npm run dist
```

## Built With

* [Electron](http://electron.atom.io) - The framework for creating native applications with web technologies like JavaScript, HTML, and CSS.
* [Photon](http://photonkit.com) - The fastest way to build beautiful Electron apps using simple HTML and CSS.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/andriyko/browser-dispatcher/blob/master/.github/CONTRIBUTING.md) for details on code of conduct, and the process for submitting pull requests.

## Versioning

For the versions available, see the [tags on this repository](https://github.com/andriyko/browser-dispatcher/tags).

## Authors

* [andriyko](https://github.com/andriyko)

See also the list of [contributors](CONTRIBUTORS.md) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
