# @wharfkit/wallet-plugin-scatter

A Session Kit wallet plugin for the Scatter protocol wallets, like TokenPocket(https://www.tokenpocket.pro/).

## Usage

Include this wallet plugin while initializing the SessionKit.

**NOTE**: This wallet plugin will only work with the SessionKit and requires a browser-based environment.

```ts
import {WalletPluginScatter} from '@wharfkit/wallet-plugin-scatter'

const kit = new SessionKit({
    // ... your other options
    walletPlugins: [new WalletPluginScatter()],
})
```

If you need to modify which chains are supported, modify the URLs being used, or alter the timeout, you can specify one or more of these paramaters during plugin initialization.

```ts
import {WalletPluginScatter} from '@wharfkit/wallet-plugin-scatter'

const kit = new SessionKit({
    // ... your other options
    walletPlugins: [
        new WalletPluginScatter({
            supportedChains: [
                '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4', // WAX (Mainnet)
            ],
            url: 'https://tokenpocket.pro',
            autoUrl: 'https://idm-api.mycloudwallet.com/v1/accounts/auto-accept',
            loginTimeout: 300000, // 5 minutes
        }),
    ],
})
```

## Developing

You need [Make](https://www.gnu.org/software/make/), [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install) installed.

Clone the repository and run `make` to checkout all dependencies and build the project. See the [Makefile](./Makefile) for other useful targets. Before submitting a pull request make sure to run `make lint`.

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com), if you find this useful please consider [supporting us](https://greymass.com/support-us).
