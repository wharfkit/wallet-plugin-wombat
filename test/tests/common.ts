import { assert } from 'chai'
import { PermissionLevel, SessionKit } from '@wharfkit/session'

import { WalletPluginScatter } from '$lib'
import { mockFetch } from '$test/utils/mock-fetch'
import { MockStorage } from '$test/utils/mock-storage'
import { MockUserInterface } from '$test/utils/mock-ui'

const mockChainDefinition = {
    id: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    url: 'https://eos.greymass.com',
}

const mockPermissionLevel = PermissionLevel.from('wharfkit1111@test')

const mockSessionKitOptions = {
    appName: 'unittests',
    chains: [mockChainDefinition],
    fetch: mockFetch, // Required for unit tests
    storage: new MockStorage(),
    ui: new MockUserInterface(),
    walletPlugins: [new WalletPluginScatter()],
}

suite('wallet plugin', function () {
    this.timeout(120 * 1000)
    this.slow(5 * 1000)

    test('login and sign', async function () {

        const kit = new SessionKit(mockSessionKitOptions)
        const { session } = await kit.login({
            chain: mockChainDefinition.id,
            permissionLevel: mockPermissionLevel,
        })
        assert.isTrue(session.chain.equals(mockChainDefinition))
        assert.isTrue(session.actor.equals(mockPermissionLevel.actor))
        assert.isTrue(session.permission.equals(mockPermissionLevel.permission))
        const result = await session.transact(
            {
                action: {
                    authorization: [mockPermissionLevel],
                    account: 'eosio.token',
                    name: 'transfer',
                    data: {
                        from: mockPermissionLevel.actor,
                        to: 'wharfkittest',
                        quantity: '0.0001 EOS',
                        memo: 'wharfkit/session wallet plugin template',
                    },
                },
            },
            {
                broadcast: false,
            }
        )
        assert.isTrue(result.signer.equals(mockPermissionLevel))
        assert.equal(result.signatures.length, 1)
    })
})
