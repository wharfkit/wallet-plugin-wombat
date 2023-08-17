import {
    AbstractWalletPlugin,
    Chains,
    Checksum256,
    LoginContext,
    PermissionLevel,
    ResolvedSigningRequest,
    Serializer,
    SigningRequest,
    TransactContext,
    Transaction,
    WalletPlugin,
    WalletPluginConfig,
    WalletPluginLoginResponse,
    WalletPluginMetadata,
    WalletPluginSignResponse,
} from '@wharfkit/session'

import { Api, JsonRpc } from 'eosjs'
import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'

import { ScatterAccount } from './types'


ScatterJS.plugins(new ScatterEOS())

export class WalletPluginScatter extends AbstractWalletPlugin implements WalletPlugin {
    id = 'scatter'

    translations = {}

    /**
     * The logic configuration for the wallet plugin.
     */
    readonly config: WalletPluginConfig = {
        // Should the user interface display a chain selector?
        requiresChainSelect: true,

        // Should the user interface display a permission selector?
        requiresPermissionSelect: false,
    }

    /**
     * The metadata for the wallet plugin to be displayed in the user interface.
     */
    readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
        name: 'Scatter',
        description: '',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+CiAgICA8aW1hZ2Ugd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHhsaW5rOmhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBSUFBQUFDQUNBWUFBQUREUG1ITEFBQUFBWE5TUjBJQXJzNGM2UUFBSUFCSlJFRlVlRjd0bldtMFhlVjUzMzk3UE1PZEpDRUpOSUFBZ1pBUU04SU1BcHNBRHNaTzNEUjIwamp4V2xsWlhlMjNmbXEvdEIrYWoxMzkwSDdveDZacGt0VW1jUWE3ZG16SHNZM0JHR016VDBLTU1vTUVRdU85dXVNNWUzcDMxLzk1OTVFdWpsZTRBaXU2VnpvYmp1NjB6ejduN09mL1B1OHovcC9nWDMvdHFacmhjZDdlZ1dBSWdQTlc5dmJCaHdBNHYrVS9CTUI1THY4aEFJWUFHQnFCNXpVR2hqYkFlUzMrb1JGNG5vdC9DSUFoQUlaeGdQTWJBK2VVRFJBc1ZaWTFETTZ0bTI5K1lUZzBjTlE0aFV1YUsrdXJIaUVNbnRqOExhQmE2cXN2cS9QT1N3QUU5U2x4ZXpsNkFmdmZub0pSSFRnSUpOZ0JTaFlCUUw4N0NRS2RNUVRBV1VmMmtqV0FyV3FKKzRNcnU3YWZGMStseGtEd2dXUHhjMDc5WVRHb3p2cU5PSTAzY0Y1cUFMUmFKZGdQcVBFSTZ2RG5RS0ZURmdOQW9HbTB4ODhEdzU2NzhvN3pGZ0NuQk90WGZWQ2ZBa0N3U0pndWtNRXcyRElhQU5pMnNQaDMrakZlZWRJLzE1SkJTOTBDSkh3RGdNa3dJQ0FrcUFXQ0FSZ0dxem5BMlVVZE1oc0MrN00wUWdPQVJjQ282MlFJZ0xOOUI1WUtBSzNxZWlBOENWNTJ2UUhBdzBGYmc3K1dBS0NmYS9TZnZnMzAzRnJHNFFkdEEwZDB0ai8rUjNyOTgzSUwwS28yd1VyRWRXMkN0OTFmMzl2WGdTbllBT0RrclYzc0xDN3lKS1FqbXV0OUpDbWN4U2VkbHdDb2dnaG5JcmMxVGxqWGhMam1lMzJ0YlhzUUhGd1FFZ1NCUFdwWDQxeE5HQzQyRnYxT1lyYkNDanpPVHdDUVVBV3hDZHdEUUhDb3pKZlg5NFBmQ3dCVkhSSkdPamN3NFhzQXhJM0g0Q1Z1QUFpSGNZQXpnLytncGdva2xJRFFESEwvVld2WEsyeHQyZjc3cUM1TkhGTEhXcm4yOTBDcnRhYXVHdUhXTlhHcy9ib21jQ1dKUUZEbHhIWEZxdEV1YXliR0dSc2RvZE51MHc1ajRrb21RTTE4bGpFNU04UDBRbytqSjJiSmRkMGtwYWhCR3FWd0FWRVVReFNTRndWUnJOZlg5cUozVVp1VzBWZXZlWlpxclp5Wlc3cjRxc3RlQThoWUs2UFNqTFJRTjFrUFdldDFhRzY4aEcwS1BBaUk2OHdFV3dXaENVVWdxQ3BISzQ1SWdwcHNmb1pXR05LaUlLWGdnckZSdGx5MG5tMWJOck5tcEUwcmhOSEUyd002QkpPa2dEQ0NNb0M1QXVaS09KRVZ2SG5vQ0srKzh5NEhKMDhRZDhiSWdpNzlvcUtVMEJNQm9qU2dCYlVqYWg0Q2dUVFBBTGhuWHJ3Zi9nb3JBZ0JWMk96VEJvTFF3S0REQzk4YmFqTHN0STk3bGV4L3I3UHM1bGNGN2JER1pmTk1kRHRzMzNBUjJ6ZHU0dUlOYlViay9wZllTazkxRFVtL0NSUXFOSkRyNzZkK1phOVRBTkkxZmVEbDE0L3prMmVlNTdCTFNicGRxakFrY3hWMUZIclhzZGxpOUQ2R0FQaHdRUDZqTTZRQm5HMEJBL1h2L1hWVEFvdUVQekRZZEFIZDZOalZ4SFZCeXhXa1ZjNUVLMlRENmpHdTJYRWwyOWFQMFJGUUpNVVMybUVqK01HR1ByRG5RcGdQU3pQNklnT1V2YWdKTmk4Z2FrR3ZENi90UDhiMzN0alA0YWtwNHU0b2MwVkprTFlNbUY0L2FRdnd0b1ZqcUFGT0d3WSthdGY0NW9QOTM4dGkwVFlRVUFXSnVYQ3hxMHp3N1NwamxJTHJyOWpDZFZkY3d2cXhtUGFpTEVDVDF5UHhtOGdwaTY3UklQNzZwL1p3blBjT2JBOFBZNHJjRVdqUEQrQzFISDcweEI3ZVBueVVvRFBHWEZXYk52QVpCMjhENkRVVUx4aHVBYWNOZ1ZOUDhDdmZHMmFuRW5LNnhUS3dCSURhaEo5a0Myd2FhL1BKRzY5aHg2WlJScVFaWEVrYVF0ODVYQmpicXZiV3YzZjlmS0RYbExaQlFuOVB5OEVHb09EUDRIM29kMDFLT0l4WUtCenpyWWdEVXhWLys1M3YwNC9iekJQakVxOEZEREptQjBpYk5jYnB4N2dIdjh5bkxuc2J3SC9ZeHBKdmZHMWJWYUhjTWtmdEhPRkExY3BuTHdzdTZLUmNjOGttcnQ2OG5rdFdSeWI4MUZ3OTZmeUtta2dPMzhsMUhnWTFSVkVpV1VkUzNhYW1RY0hkV0J0K0wvYy82RzJVR2JSVGl3dnJIQm1IRlJHbHJobkFveS92NTVsOSt6bVd5WDVJelJqMVdzRGJBQU9QNVpjcHhJOXpyUlVCQUNWcXBJcTk5dlhyTklvaVhDbnZZS0Jlb1JNV3hHV2Z6OTM5U2E1WWw5SjJNQ1p2emJSNzBUelhRUlZESlJ1L1VmdGFwTTIrWDRmeUhyeVJKM2N6R1dTTmRZNmVXdldKV2hLMlZyTis1WUdRVmpVekJmVGJLWC8xM1NkNGV6cWpGN2NvRFFBV1JXaTB6TStubkQrTytENytjMWNFQUpBNWJxcC9rSm1yMFg2Y0VwQUVrQy8wVEYxdnV6RGxubHR2Wk4xb3dsZ0E3UW9pVjNsSmVzL1JGSDdzb3BQNW5KTzNVQm85Z3FJUnZvOG9lSU5QcjZITHBCRW81MmVwZ0FFZ0IrcTk2a0hTWVpxSXA5K1o1S0huWG1XcUNpbkNVMGFmQWszL3VPYmc0d3Z4NDF4aGhRQWdibEwzRXFUUDRvV3VNZ0RJMnFjb3VmemlpL20xMnk1bVRRTHRHdEt5TkJmUVozQzBuQ1VNcVdxdnljM2I4emp5RzRNcy9nS096aXh3WkhxVzk0NGN3N21BbUpqUlZzSzFWMTNHMmxFZ2c1RUU0a0grd0R3SHZZZEphSTB5SDdRNEN2enhOeDVqc293TUFOcjNCOWJGY2pJQVRhRXU5NkpRS2MvSXhSU0JRd3RYVlhxUmM3U3JrblpWMGFvZG05YXY1ZmJiZG5CcEI4YWxtcXVDVmlBSFhoSWVXTzBoVlJTUU56NjhWcmUyOS9rU1pnczRkR0thNTE5OW5YZVBIbWUrS0lsYWJib2pveFM5UHQwNEpzeHlycnQwQzUrNmNTc1RFYlNrWFJwYjBGUkMzVGN3RldtWE9lQXZ2dnMwcjh6MnlPTTJkUjNadVhKbmw5dXg3QUVnN2QzT1Ezb3hsSjJFckM1SXlwSjF6dEdhbWVMYVN6ZXkrL2JyYWJkZ25NTE10MG9XdUJsNUVCVit0ZXB3ZFlsTEE5dVg1M0o0NmMxRHZIemdJTy9OOVptcFErYURrREwwUnB2WkhLRWllejJpdWtXM2lobk5TcTY5Y0MzLzhzNHJXU1V3bGhtQjBnSkJTRndrWkRJVVMwY2FoankyZHo5Lzl2SmV5dEcxa0lXMFhVQS9rU0c0cUw1a0dhQmgyUU5BR2lBcElsdzdZcTdPY1ZSMHFvcTFWY1dWYThiNXpPN3JHRy83TFgyOGxpM3VmQmpZWEx6UWxubWtmVjBHWEFyVEpieHg2Qml2dm51SWZmc1BNRk9DU3p2a1lZSUxGUkZRK05iNzdnYUFNQWVYMEFsYXRMS2MwV3llTDl4MU05ZHVtYkQ4Z1ZrVlFVUlk2djJWdEtMWVZ2ditHY2QvK2NIM3lkcXJDWXFZZGlVQUtCOHhCTUJwNGo0Z3FDSmNvcFZia1VZMXJielBXbGZ5NVFjK3hmcXU5OUMwMnR0bDZiK0p2R1Z1aFIxMVNHWkNodjNUOE1qekw3SnY4aGh6WVUyaG9JSXM5VHFrckFLaUlEWUJ4YzZyZDRITnhRNFh0SlR1b3hOQXVuQ0NHemF2NXJPN3J6Y1BRd2tvYWZhb2pwbDFCZDAwb2NwZ0xvYi8vTTJIbUFtN3hLNUZxMlFJZ05PVWZITzY0dnl4TFpzb3FDam1wMWdUd1JjK3VadnRGM2JNMnJkaUxGYzFGZHlCbDU1VjdnUVVWVVFad1R0VDhNMmZQc3ViVXllb0owYm9oeklRUXpQMHRIZExXOFMxakVvUEFETXVaWEdFbUhib1Z6VlJYVEZLeG9WeHhyLzlqWHN0dnRBVitDcmI0SmtQS3RweFpBQllTT0VQdi9VSWt5NGxwVTBxRjNHb0FVNGZBcllmeHlsMTBhY2JPa2JxblB0dnU1a2JOb3pZelZkb04xQmdYbnJiS1pXblZhMnNtMCs5eXNKLzdiMVp2dmZrU3h3b1lEN3BVT2d2eXZBcGpoQkZGdXRYQkZHNFViUXVzaFd0bjJ1cXNpVFQ2N2M3bEdXZkxobnAzR0grMDVkL2c2Q2ZjVUdyaGJBa1kxTUFTTVBJZnA2UDRRKy8vU2hIaTRoMjBDVXA2aUVBVGwvOFB0WXY2NzJlbjdXVmY4M21DL24xMjNmWUt1M2c2RWpaTytmOXVUeUVUa3l2cktoYUVRc1ZQUEw0czd6eTltRk9CQjFtV3hQTVJpMjZCTFNLc3NralNNVVBhdncrV0JJV0thRlVWU3dFTVdXcTZGOUZYTXl5SnBqbjMzL2hBY1lFd0VwQll3c0hzaEE1V3NvQ0Z0Qkw0RC84elhmcHRTYUlxNVMwaEV3YXdDcVFQOHFkT0RQUFdmWkdvS2x5Q2tiS25JdlNpTis2OXk0MmpHQXAzaml3NlA4Z3drTmRSdFNkZ0JNVnpJYnd6TjQzZWY3Vm4zR2k1M0R0Y1JiU05uT0VqTHVFa2R4bkdWWEo0NElLRjZwUzJEZUNhV3VRak9MYWtWU09YaERqb3BnNGhMWmJZTnNGYmI1MDEwMG9MSkNxME1TZUZKa1hZS1doQmN5RThCKy9OZ1RBTHdHMmp0QXRNRkVWZlA3V1hkeXlaYlhkZElKQmFGZjFBUXJ0eWlJTG1IR3dFTU8zbjM2TloxNTlrN2c3N3QzQ01LRlhWNWE1RzZtMUp5dEFwTlZmVWR0RDMvdHFvaWIvWnhtRHFDNm93cFo1QjJGVjBDbm11Zi9tSGR5MjlTSkc2NHFXMlI4ZUFMbE1sVWFaN0o4dStLOFBQVFRVQUI4WEFZcWhLN2QyU2FmRjc5NTlCK3VDbWxRWm1sQXFYRDYvOXR5RXNJN29hKzlONElrM2ovRzk1MTlpcW9vSWttNFQwNVZrU29KSXVRUDVqUW1CTlhnSVRQcTZ1SmhFNjlneVB3UkJSaDIyREdCcFdURGhNcjU4LzExY01ob3hGdm95TXp1M2lzZ2JEU0NOOFBTK1EveXZGMTRZQXVDZkFvQXlZNE9hT1g5ZTQ3NlpMK2VUUGtyWEp2MWovTmFuN3VMbWpST01XUkhISEtyZmtuMVF5bjZ2RXlJWE1SZkE2OGQ2Zk9PblQvQmVFVkIxVnRFdjVEMm9YS3dralNwYzNTZXJVNnF3WTllV1plK0xRWnNnclZVYktad2tBRlRVWVVIbFFvTEtzVHFLMk5TSytJTUhkakd1M0VEb2NHVnVSYU80bUN6MDBRZmxEYjcreUZNOE5IV0NmbXVjeUNYbUJSVHhvQmI1NHk2TFg5N3p6NW9Ob0xxOU1veEpsYnQzUHF1bm0yNnh2Q2l5ckZ0SVRwdWNpNU9DTDM3NlY5bllDYTJTSjVSZlQ2R2FERXJWM3Nta0wwcmVUcnI4OWNQUGNIaHFsb1U2SWxkWUtFb3RVamVJeGV0ckdhcG1VTFdGTllsenlOalQ2emVoQTZzcHRJNmdPb1dxZzR0eld0RTg3YmxqZlBIV1hkeTU2U0xDd2drQkZBa1dYaDRwRmlCcXMxQ0hIQWYrNkp1UDhWNEZaZG94RzBWMUJTMVhrd3MweTZjbTlPemxBZ3dBUVV4YUZ3WUNXY2JhWjdNNkpJZ2o0ckNpeW1icEJqbWYzbms1dCsrNGdxU0NNU1VHVlltVHFHUmJtVDc1OFZybElWOTkrUUNQdi9vV1ZSaVRFMVBVRXJRdjdoaWtrWDFabGsvSkt1ampDelpQUmVkTXF6UTFobXIzeXZzdzBnbUl5eW0yWGREbGR6NzFDZGJyWldXSHlPZVBmVTZoWGN4RDFHRWhESG4rNEFKLy9hT2ZNcE4wcUpLMmFZVzRyR2tQQVhCS2RTbERwcGg4cWhWY0Z5WU1GV0tVQ3NrcTA2Y0lYSCtHUzllTjgzdDM3MkpWNkFNMFhkbHVDcnlFaWd6V0ppeXQzZU96cy96Sm95L3g3a3hHMnVuU3J4VEVzYUx2SnRXdjFpN1hkQUpKSkY3b2kwT3oycElHWFVPMlN2VWVzNEtPeTdpb0JaKy84eGF1V3RlMmxSeTRpbENheHdwVHpBUWtjekh6Y2NpM24zaWQ1OTQ5d2dscG9LUmwwVWdsc0ZKWFU0Uk5YY012VDR0L3JDdWR0UzFBMXJaaTlnS0FoVk90WkNLaWp0cmtXWTkyVkJGWEM5enppZXU0NTlLMVZGbkdlS3RsTjFKQ1U1VFB4UUc5SnJ2MzZQTXY4L0JiSjVpdEU5dVQrM2xCbktTbUhhdzl3S0NnL1Y0MUFsN3dabldvdkh4UmI0RUViMlZuNXF3N0tIdGNVRlhzM25vcDk5NThHWkZXZjZ3Z2NVbXFaTEVMTFo5YzFBVkZLK0hBWE0xWEgva3BCM3VPaFVCNTQ3UUJtbTlBOFY3Rzhqbk9HZ0MwMmhRV1NXcnQvNzdvVTF1QXRnV3FncEdvcE8xNmZPbHp2OEwyRnViemE5WEtQamN5QnR2akxkSEdHNU1aMzNuc01kN3VkeW1UTGxFVVVwWVZTUnhUVmtWVCt1VUJZQTZiN2ZtK29VUlhIZFRwK1hyRFFaVlFUZWo2cE9Vc3QyNjZoTS9mdEpPdTFQaElRRThoYWVRQ1JyVGtmdWFRdHdLbUEzajR4VGQ1OExtOVJLdldrNVZxRnZGZHc3VlFJdmRBZ0JrMmhneHE5MVY0NlFIZ216c2lTOHAwa29ocTVnaVhyTzd3Mi9mdjVncVY0UmhmVCtNWktNbmpJdm8xbGliK2Y0Ky93dk1IRGpBZnI2TU1WQ2FpanB4Qmk1Y3Y4enhaOHlVZ05ZV2xycFlXOG1XaEVyNS9YbVVWUVBwdGk0eHQ2MGQ1NExxYnVLeXRsSy9lUjBrL2xUZ1ZQbFpvT3FHZUs1a2JqemxTd2g5OS9YdjBXbU9jNkt1Q3FOTUFUWUdtaWtwdW80dWJOdlRsb1FYT21nYndxNkNweXJWcVdZa3BKZ2dUVWdWWThoazJqVWI4M21mdllJUFI5S2pNV2dhY2hXUUlTM2tSY0tpRVAzdndjUTZVMm9NbmtPSFdyT3RHNVo4aWM3QUFUN1BLTGQvZmJFUG1qa29lQ3ZRb2Q1ek5XNlJ4eHlVWGN1OE5WN0c1M2JiVm41amhGNUJiNU5EM0N5YXFCSFV3bWNCWGYvUUNldzRmWlQ3dVVDc0xXRVhtWlNqT1VJYktLVlFrbFFDd2ZOaEV6aUlBZktXL1Zwd0YwOHoxaW5BdUlpbjdyS0xIcFJNdHZuVC9iYXpSeXBPbnAzQ3RXUW9oVWVWZHRUZm40WTkvOENPT0tBMmJkeTBndExqWlUyQ3czZnhrRjVFNmRwUTJia3EwWmNncG95aGc5QmRvVlRuamtlT0t6UnY0NUUwNzJkUUVkd0tyTXJKSVBxNVM1NCtLVGp5ZzhocGUzRC9MTjU5NmtoTnBpemwxak5DaWxRZTBLaCtBeXVPQ1hsS1NscWwxTnkyWDQ2d0N3TmRxS2dhdmtJc0VHbE83Z0U1ZE1GN09jZE9XOVh6dXRxc1oxV1p2YlZvU3Y0Ly9SMlZvalpuN1p1R1BmL2dJN3lVUjdXckVqTEt3MXRWOGdNZnZ2MTdWRzhDMDJwVTZ0bFN2YndyWGxxRGkwWGFWc3lvczJYM05kbTdjZHBIbDhCWHRxK1J4K0ZJUndySWlidWhrdFAzM0l0aTcveEFQL3ZnbHB0b3BrMGxNMWhxaHlrUEdEQUErYk4xUENoYlNrbmFoN09FUUFBMHJodytrR3dDc29UTzJLTnFxT0tBMWQ0ejdkMTNObmRzMjBGYlBaK3o3OUNwOE1hZ0FJUEcrT2xYelB4OTZpRU9qYlVhS05rbWx6TDRpZS9Jc3BPWUhBRkFwdDI4WVZaSkhEeVVRRlJDU1VabFdCUmUwUW43bGhwM2N0R1hVbWtKVkFLTFVYcEVFekZ0R0lhWmR5eGJ3YWwvdjZYQlY4MysrL1czbStsMG0wNGpwZG9jc2FhTWloTkUrZENxRnJEMEE1bHNsN1Z5ZXpCQUFUUkJHZDdpeWhncTFVVmtUaFFzWW9XQTBPOEVEdTNaeTZ4VWJyY3AzMEJHa1ZhM2dqWnBDZWxHTFBVZG0rZk1mUGNueFpOUTBnS0o3aEJsQm9OYk5tcUowSkdtSExDdElWTmNkT3ZwWlRydlZ0bVlSNW1aWjMyMno4NUpOWEgvRjVXd1kxL2FpUUU5TmtqVG1vL241aFRxL2NYbEpHTGRaQ0FKT2hQQVBUK3pqcFhmZW93aGJGR0ZBSWEyaXJhSldNYXZ2VS9UYmpXd1lHWmtETHFMbHNRbWN0UzFBYnJiYXZDWFFVd0JRY1g1SXA4cFlYYzF4LzgxWHMydnJCcDl4YXhvMXJJZXZWZ3JYV1FuMjN1TnovTVVQbjJRcUhxZFZLcjZ2UFZjSm5NeGIvM1Zrd1p6UmR0dUNOVVV4UXhLa0pNU3M2clM1YXRORjNLU1M3NDV2SUduSkcyaENBTllnb2w0QUNWS3FTWjNCVlVXWnBCeDM4TjJuWHVPbEE0ZnBCOG90REVyWC8ybkJMcWNZZ01WQnptWlp1QkV6S2VGaVc0QVBETWt2YU9jOTFnWVo5OTJ3blp1M1hrVFg0c1RlVXZlTlFWcWlxc0NKMkR2WjR5OS8rQlRIbzFFNmhRb3lsZU12cU1QU1ZIdFlCWFNqaUgveHE1OWcweWhrbWFQdFFxSWNSanZRU1gxc3dmSi93bzZWZVBzbzRLRFVRSHRGSlhhUUtLVG5ZTmFwdHZBTjlyNTdpT041UmRRZE4wMnpsR01JZ09ZdURhSnZmaWYzNVZzeTBxUWkyM25HR3Rmbm51dXU1STZyTjlFWnBGd0hkODhTTnpXOUtPU1ZFeFZmK2VGVEhMSFNiY1gzUy9PM1phQUpZRkZXTVZLVi9QNXYzTVdsbzhvajlPazRXUkU2d2F1VlNtNmQ3SVpJOWtOVHNTTUR3UmpDU3B5MFNKeFkxUEZvRHQ5N2JBK3ZIenBDUDBySVpGTzBtckxrSlNCZ0NJQUJBR3pGeTJLWHNTWkRNTEFHQ3ZsMm5iSmdOSi9uazFkdjVkNmJ0dERSaXBmdnZJalp1WFlWZVJxWkYvQ1ZoNS9rWUJhYStsWmhoL2JhTWhTWlJNeWFwRU8zdjhBWFBua3oyOWRBVWs1YmVGWnJ2cXh5aXFpMjVOTWdRYVMzcCszQnRoeDFGMUdTQlNsWmxQTDJMRHo5eG43MnZQMGVjOW9XMm0xNmVVNVh4QkE5V2FvZmZnd0IwTnlqUVM1QVpac0NnZSthbFE4ZmsyUjlWcm1jS3k4WTQ0djMzY2lFQ2paK0RnRFNBSGtVY0RDSHIvemdTZDZaS1hHaVpwR3hwYWFnS0xJU3NWRmlXclBUZkhMN0pYem14aTEwZy9tR0I4NnJlSFhyWldpVkt4YlFzcWJ3UkhYR3B0RnI1c3A1OHFUTE8xTVozM2prS2N2dkgrdVZWSEZDcFk1ajZ6R3JmQlBwRW80bG5yYUVLLzF5VGpsck5vRHg5d1JxbVZKUXRXZ1NNdkx6SXRLcVpCVVZGNDhrZk9tQlhheVdUei9nOGZYYTMwTEQ4aHlPVi9EWFAzaUNmY2RtNlhYSDZJZUJSUXd0M3k5akw2c1p5VE0ydHdPKy9KbmJXTjkyQk1VOGlUcUFGQzVXdXRqY1BkSEJKV2IxdWI2cWhrUEtCSTZtOE5iN3gvbk9qNSttbjR3elZRU1VTY2RiK2szSVdZYW45U0V1NFJnQzRLUU40QU0vcXJrTEJBQXIvcFFwRnBPVUZhMXNnUTJkaE4vOTNCMXNhaW1OZXlxSDc1azYxUElUTXgrR1BQMno5M24weFZkNXAyeVJwNm5GM1V1NWkwR0xlcUZnZGRLaW5qN09ybTBidWV1V3E5bVF3SWlGYUJ0L2Z0QS8yRlNJbVFJb1lQODhQUGoySzd6eHpydCtHd2hUS21Vckd6QmFLWG5EQk9iTHlqNzhHQUpnRVFBa2JBRkFHc0FYWkVZRVlVcWQ1YlR5SGhkMVcvelcvYmR4ZVhlUU9mQ3BYTXNHdXN5S1FQdDF3RnlVOHZjL2ZwckhEeGIwNHhaQnBIQlJnYXRxT3NrSXJsZlNqVU9DWW9GdFd6Znl3SzdMV1R0d0t4dU9JR2tWUlp3VmJEcHdISjdhczVlZlRaN2dpSGdDNDlqMitxalZBZ3RYSzFQb0Mwb0doRldWMVNnT0FmRGhkK0RrR1NHQmkwMzRZWkJiWE44Q1FlTDVLZFQ1VzdJcXJybjNsbXU1L1pLeGsreDZxdDR4bjl6MXpZclBLa2VaanZHenFXbis5dkdESE8wVmxOVThjU0l5QjRWOFcrUnkvZElPQ3VnVytUdzdMbDNOMWcwVFhMNXBNeE9pQnF0QU50eUJZMU84ZlBBOTlyNS9rQmtjcTlac1puYXl0aWJRaWJFUmVndHpST3BRTXE1Q1BVSUw2MHJ3UlRRRXdHa0lYNmY2dmowZnI3ZGw3VWtVdFRkYnZOMFpiOS9GYThiNGc3dXZ0aHA4VWJtWmZTNEYwS1JYWmNSWmEwWWQ4czAzVHZDVFBXK1FtMlUrd3R5OHRFVExHTHR5dVlkeFJlRXlVcGZSRFJ5cHdzQ0sxVmVPd09qZEhJV3FpTnBkZXM1UnlSNmg3U09BVG5FRlI2ekVnU3FDN1AyZllpeVQzYkdVWTdnRmZOaGRraXZuMU5mbk9YbGJnZVAzNzlqSmp2VWpKS0xuYVVpNU02dkYwKzJzU01RS1ZsUzgzK3J5Vnc4L3g5SGpjMlJWekh3UkVIUzY1RVkyNlNnajFmaVhKS1ZQNDBxdzVvSkt1SElNelREMEdVbjFESnF0dVVRUzhPVW0yQSs3ellPL256VXY0TVBlb0FDZ2VIOVk1ZHkwcnMydjdiNkZ0YkdTSzc3OXIwcFVsT0dMUkZUaG80TFIyU2hoMnNIM2Y3cVhQUWNPazQrTU1lZEVER0hFTG1hcFc2bzRWTXlocGxZM3NaSThzUWhFdE13OUgzQmR5U05RbWxqcDNxV0pkbWxuZmRpbi91Zi8rN0lEd0dEbFd4aFdxcmJ5cWVIN2JyNkIyNjljUjlxSHJ2YUN5SWVRVlJ1b2VIK2cydjNHa0R2czRPK2VmcEU5UjQ4ekY3UndrVkt3Y2kvOXl2ZUJvcWFqVXlHZ3B0ek01d0Q4S0JramlUTlhkV21pWGRwWi8vd0MvckJYWEhZQThBV2NpOHpwMnBHV1BUYVB0Zm44blovZ3NsSG95Z2cwbTEySE1mcGEzQ1kwK3M2QVhoSWJUOCtlbzNOOC8vSG5tSzlpWEoxYWtFbEdtd0NneDZENXhITjkrVmhnRXgzMnpjYnlOcVZ1bG5BTUFiQ0VtN1NVVTR5WFg3dXYvZDkwNjZwTXZGamdqaDJYOFpuckw2TlZGSXdhNGJkdXV6YnkyTnJBWTllbnJuTHFWcGNGWXVhQmg1L2R4eXNIam5Lc1gxSEdiV01UbFdvWHk1Y3FoaXNWaDBTQjhRNmlSazhGa016SzlPL0JEUUd3RkxHZDJYUFVCa0EyeDdwMndLL2NzSjFQWEhZaFkyck1NV2FIZ0ZLMHJMRXFlOVJOVkZtYm1JWTQxWFhNQW5Db0Q5OTYvRVgySGo2S0d4MjNtRTFDZU5LM2o5c3Rza3hsUng1d3l1RVBJbnRMblFReTFBQm5FQU8xcUZ2VW0rOTZySTRjdjM3SHJWeTd0a1dhTjd4OW9nS0s1VVo2anFDV3BHRlZPMnJYRGExMC9HZ0FQLzdaSVI1NytXVWorMHlqbGlXanlpZ2lWL20vNmhNVVBEQmVYMDhRWVRwb2FUdkFzcXIxUHgxUkxEOGI0QmU4KzFJTm5pMEpzeUlzKzF5VXBOeDM5WFp1M0RKT1M5VTY2aEVNRlZKT2ZERFpDQ05zMG9PbkFROWpaaFRzaWVIdFl6MmVmdWwxZm5iZ01DNU9qUGxqdnF5SjJsMXlGWEEyR21EUUxEcjBBazRIVG1mbzNDU0k2UnROUkcyQm1MYW9XWG9MZlBGVHQ3SGpZclYvaS9DL3BLMjJiM1BlamJqSERFVlhWMlJGUlpLTzR0UXJXTUZrQUUrOU9jbHplMS9oUkY2eW9JSXZsWG5IdnZiSUY2dDZsb0NUL1FRZjh0bUdXOEFaRXI3WitmTFA0OWhxN3JJc1kxMTNoSGg2a290SFV1N2VkUTFiTm5iTmVoZGxpM0lGSGdDcTQ5Vys3cnNQQklLZ1Rra2lYOWpSaitDcFY5L255VGYyTVZWakdrSk5KYklibEE0T3JEbFE1ZCs1WWVBa3cyOHpXdTRVNDJjRGt5VzZpMmZ3Tm4ya1M2K0lMVUR4ZjNQUkxURGprMEVLRUxWcXp3eSs0OUtMdVg3N1p0WXJVR1Q1eElwSWZmc0RDOTZDT3NvNmVLcllqdjRSajA4RUI2bDU5UFhYZVdyZlcvUm9FNFpqa0hsbXI0cWNQSjF0K1A2OVp2RE5wTDdqMkI0RFJwRWxaZ00va3BUTzRKTldDQUFVOFdzR1FabFJwbWtnRlhGWmtGUVpVWm14ODhvcnVPL1diWll6a0NtbmlsK0ZpQTBEOWh6L2ZQUDJiZGdRUmoyck9wN2pHZXc3Tk1tUG50N0RWQllRakt6bTJHeVAwVldqRk5YY29ybUNwNXBLbTBtREo4ZlRpR1ptSlI0ckRnQURjZ1dGZE5YTUlTR1BwREZsYjU2dEY2M2lwcXV2NG9yMUkyWU1pa0xPaXIrczBMUFp6NFBhSm43SlgxQWl5TnEzUkJtSDV4TDgvbk12OGRxSkUvUTdIYVo3ZlRxSnJqRGdEMmpHeHB6ODJRZXR2SFphV2pKb3VZRmsyUVBBa2pUV1BEb1lEdVZqZG1XUjAyMmxsUDNNdUhsMVRsd3VNSnBHWExmdFNtNjVaaE9yeE94cDJrQWwzNzZjWEV1L0w1YlFNS1FyRW1lNWkyS09VcnQ1Q3c0NStNNExyL0hzTzI4VGRpZkljei9odzZ0NjMwcnU5VW16RlRVL0x6VmtQQVRBYWQ0QkR3RGZGenlZRG1aVEJJT0FJaS9vdE5vVW1jaGdRbkdDV0x0NVZCWnN1bUNDVzNkdTU2ck5YV1AwbEx0b0lGRDZPZkpnQ3VYMithWUVYd2F1Y1RJcFRBSS9mUFpWWG56elhSWVk4VTFtUWR3MHJ6Ulp3c0Vjb0dZZW9FclFWdUt4TWpTQXo4ODA3QjMrYXhPemEvb0Ztam1DUldaVXJhRW9aNG9GMXJRU2JyenlNbTY0Y2lQcjJwNDV2R3NoNUlaWTB1WUorRmtDZ3BnS1VveXFRa0NvNE5XRE0zemppVDNNWndWRm5CQjBSNHhLbnNnVFNnOXFBV1dVS3FpMEVvOWxEd0J6QTMzVnBoOE0xWXhxa1VyMmc1c0dRNWdhemg4OXdmbHBvSzJnaE40Y083WnM1STdycitiaVZaSFpCZDI4c1F0dGdraEpLVTRLdTVweWdFMXJHTEJRdzllZWZKM1g5eDlnMmdXVXJTNG54RHpTSFYwVU12YlRRWmNUOGRQcEFIRkZBRUNsVjRQTW5TZDFiS2dpbW4zWk1vSTJWTEt4OWFUZUxaMmMwNktpVGNsbzROaTZjVDI3Yjk3QnBnZzZoU2ZyVUxTNE5QS0pwdTFjUUtnQ2d0TGJDUW9hUGYzcXV6eTk3eTBPTGVURXE5Y3lreHRoUVpNejhBeGpRd0NjRHV4Tzg5eEFUS0JXTnFZOWZOQkk0bk9GM2pEenhJN2VFd3VzN2RzZUVteVpNeG9IeEVWR21NMXp6UlZiMmIxdEs1dTZBYWxuYi9HekJnV0dzckRDRUNOL1V1ZXd0RUNGTVlEKzVmZWY1SzNwQlNaVkE5Z2FNWmZTY2dZcUVHMDRDRTd6WXkyTDAxZUVCbEJtenhvOUcyWlAzMGswc01jSFFSbjFHS2lTeHpPRUsyd2NSQkZKSE9LeW5zVUZSRWNuMTNHMDdISGo1UmV6ZTlkT281MGJqSTIxT0xIMUZTanNMREtRaUtKZjJiQ0tRd1g4NmJkK3lGU1FNcWRtMEdhMmdHY1ZIOURYTEF1Wm50YWJXQmtBK0lVZmFiRkR0dFRQN0UzSHFNcnBoaFYzZnVKNnJ0ODh3WVRDeUs2MCtVTTJXa1MwQy8xdkFBQUsva2xFUVZUOGYxRk01UUtxdVpKa0pMYlE4VGQrL0FJdnZEL0pWS3dHRkZrVG5rdElMS1JXcXI0Q2p4VU1nSTkrdHhQeFNsY1pTWkJ6Kzg0cnVYUGJaZ1BCU0NFQ2FqRkVCWlpORHRXNXBLTGgydWNPRHN3Ny91OC9QTUt4Y0lSZTJMYllnTmhJQklDVmVweVhBQ2lMZ200N3hlVnpqQVU1RDl4Nkk3czJyNlVqTWdtdDVFZ2RCQ29lalFuVmd1QWNXUmhhN3VDdmZyU0h2VWRtNlVWdGl3c0lBT0liOXR6Q0srODRMd0ZBSkRaU1J4SlcxTDBwTHB2b2NPOTFPN2x1NDJxYk51b0xRUnl1VXJoWmlhUUswVTNNSnpIUDdaL2lXMCs4YUV4ZzN2ZVhGeUFBK0k3aWxYYWNsd0JRbGJBSXB1TElFWlh6ZFB0emJGc3p6dWMrc1lzdEV6RlZYcEtvSzhXbVNrb2p5RFNveUpNVzcvVGdULzd1UWViaXJnMmk5UHlDenVqcFZ1SnhYZ0tnREJKdjVNbDRLM3VNdVp3MUx1YzNkOS9PZFp0R0NEVnJNRlovZ09ZRmVOcDQyUVZaa0RBTi9JKy8rUUVuU01sVlFxYnVFa1VSYkJieHlqdk9Td0NJNU5GRmlYVVFPNWN6NGdwRytndmN2ZU1xN3J0K3MzSDdpMDlLZklMV0lOTHdDaFpoeWd6d3A5OTlramRQTE5BWFgzMmlXWVBhQm9aYndJcUJ2M0VFYTQ2d0drUnE4UU5XZFBvTFhIL1JldjdWM1RzWlVlTElVZ2FxQ0JKcGhjOGlpc2w4Vm1OaEgzNmV2WWVueU5PMlZTcXB0RHdaQW1ERnlKOWFBbzBDaWtoa2swb2pPOGFya2tzN2JmN041M1l4MGd5UHROeERwRm1Ddm90SUF5NEVnRDkvOEZsZVBqcURHeGtqVXpKUlFTWmxGVmZnY1Y1dUFZRTRDVVE5RzJzV3NSLytNT0ZxMXJtS2YvZUYzYjZxeUlmN0tVTE1OUlNsclFDZ3dkQi8vdEJ6N0QwOFRkNFpzZnJDSkkySnMyRkYwQm5CdncyR2tqTnV5UmNsZkh4YmVWSEs5Zko1L2ZaSWg2ejBYTDZ1S0VqaXlPWUZaNzBla2NpaVBwQ3E5VGsvdFlMM1VzaGlqWTBwV1YwVjNMaHVMYit6ZTRkNEptbXAzei9XNUJITkJwVENjRFpxZGlvSytOTWY3bUh2MFJtaTlnaEZiNTZKYm92K29GUHRqTnlGTTNmUlphOEJiSmFmQUdBOGdWNzRucy9IcTF3MWsycDBqS3NkM1NTaXJpb3E1eXVJb2tqZFFhZHVucFZ5bUZlWG1EQnpBU0FzaWJJRjFsUTVuNzMrV202L2JEM2pHa0JxSmFFS0NJVjB4QWhtYlNjaGt5SDh0Mi84bUVOVlNwaWtCRVZHU3hPTTFISzJBbzlsRHdEZDB3R05uTFZ3TmxXNFd1RlZudEZORmEzVDNPQ1NQSnNta2xFV3ByaTRaWE9EYW1NRGJ3STJpdTRaVDNCTVdmb080U0IyZEYzQlJON255L2ZkdzVWclFpc2pxMXpQNkdvMGxrN2o2cFVsekFnNVdNSi8vOXFETEhSV1d5d2hWUzZ5TEtpYXdSQXJEUVBMSGdCYTU5cVB4ZGp0dVhoVkVhVGUvcHd4VlhOcXBHd3I1WWJ0VjNIWnBldDQ1LzJEUExYbk5ZNzJIRlY3d3M4Z01rWXZQMGxZbkVTaW1vL3FpRGdPQ0lvZTNUSm41NFZyK2MxUFhVZTdoSmJtRlpueUYzQTBGaXl6eVI5aUpuM3k3YU44L1ptOXpLZWo5RXZOQ3RiVWsyRkYwQmtEdmdEUUxqVWdLa1NzSU1ZWXJqeC92c0I0NEZnVDF0eDcwdzFjZS9FcXF3cVk3Qy93NCtmRTRYdU11WGlVWERGN0E0RFdzam9EY3VNU1VQRklYSlpXOFhmdDVvM2N0djFLTm83N2lxRXdFbW1WV3MyMFhZU29OYTBLMnZUamdLODgvQ3d2SFoxaFpqQVBxS3BKTlRocVdCTjRaakJnQU5BUXlDZ2lpNkN2NlJ0MVlWVSt3Y3h4N3JsdUovZGNmd1ZyTkRUY2FCOGpUdFN3OThBMGorNTVnK01MQlM2eVFrQnJDNG1DZ2poTm1Ea3hiZTdlWGRkZHh5MVhiV1pDODUyMCttMHJGK0dUTHp6SnNoNWhQRVlScGJ3M0IvLzdHOTlqSnUzUWwzMFIrUEV2S2xtckIxT296c3h0T0dOWFhSRmJRR3BiUUdoYlFDNGgxd1dqb1dNTkJWKzhlemRiUmhOV3E3QTM3MW1ucUhoOTVhNGRuSWFYZm5hQVE4Y25tWnljSk05N3BFbEluUVJzMkhBaHU3WmR4V1ZyT295cElOakdDdFdFR2kzYkVFRGFvS2VnWnJaS0thT1lSL1llNHdmUHZFQTUwckZ5TWFPS0VqdUpETk1sa2tTZE1VbCt4QXN2ZXdEWXlqVUdNVC8wellaRTFoVVRvZU9XS3k3aFY2L1pUTHVzR1ZHMWtCbDduaTlBN0lOSzVEVmRZSmJUYWFiRG5PUVdVUnVaMnNSa3lLbSt5Mm9EQS9VWXEyUmN1cWRrSWVqVEQ4YzRuTUdmZk8wbk1MNktFL204YlVPK044QjRhVzBBOVVvOGxqOEFaUERKSi9mRC9LeFJ0T1VjbzY3a3R6OTlKMXRYaWZXekpuYVo3ZFBXQm1pQ2FZWkZHZE84T0FCVTZ1VUxmbFRBcVdSZlcydFlaV0RpQ2xjWldETmxOTFdHRVU5SE81UGt6TlBtNjQrOXpaNzl4NmphSFVxekQrUWtOZ0F3SjNFSWdET3lBSlNYTDlQY0pvbEVsV2J3UkhSZHdEZ0Z2L2ZaM1d6c2FoeThHRVJteU5yamcwa3VKSzRuUDlFbWdhRzJiek1HRTZ2M2owSkhXeXRXYUZBVmtPb0drNEMrRFl4UDZCck52SGNDamlVWlQ3eHloRWRmUHNKQ01zRjBuaE9tTWloN2Z1QzBOSUJaSHl1ekttaEZhQUNuY2F2VzJpZitIcThCQklEZi9jeHV0blI5VzNqUVg2QnFkNXY2ZnBWNHF4MThNQVJTVzBjemtzWXFpYlZhTTJzWk0wSXFkUjQ1eFFWazJHa2NKTlE1ekVmdzRPdUgrTWt6ZTZHN211bmNrWFE3NVBxanRaODNIRVhhTWxRN3NBS1A1UThBSTJ6UXNDZmZ4U1dqVFBUeWFYK09PM1pzNWRQWGIyRzFXcjhLTGUyRzBxVVp6MnJqZWs2Nlo2ZEd0bnAxclZYY0ZISU41c1VHcWExalJRQ2tLVjQrbFBQM0wremoyT1FrblpHdWhadU5UOGlWOWw0R1Q1UGNMWGV3QW84VkFRQzVXUXJqYUEvWFRaYzVPQ2JPb0lWcGRtMjloSHR1M002NHVBR3NUNjhaK1RKbzQveEF0VzZ6U3JWYUc5ZlE5NXRwOVdzU2FVaVZ3T0U1K09tekwvRHF1MGVaaWNZSmRhN0t4V3ZsQThSSjQyY1dOa3JKeEc3RUZDdndXQkVBME5BbVAyRENnMEJHbTZhTGFzQmt1K2h4Njg2cnVISDdwV3lNTUlJb1R3SGI5QURhTm1EVHBuMXppUjNpZzFkT3djOFAxbUNvSXNZWXhkNmFLbm5rdVJmWTk5NTdoTzF4d21UQzA4bXBsVHhKeVBMTUpveXNUSVgvanhHNjdBRWdRUW9BZnFpVUxIbXZ5cFdzYVd1a2ZKbFJ6VTJ6ZWYxYVByWDlDaTdvdEprWTc5SnBOOFRTVFN1MzUvMXB1SCthYmFIcEZXWTZoME16T2ZzT0hlR1oxOTVncWl4b1Q2eG1acTVQSExTTVNGbzJnb1pTVzJhaXNTMFdzOElNVzhQT2tQcXpjS3dtZHFtS3g2aGJCUVRQRjZ4V3JqU29hVWNoVmQ0bm5wdGh6ZWdJYTFhdll2MEZhN2hvL1ZyV3JPclNhVUVuOHB5aUFvL2F2YWJuTWlhbnBqbDBkSkw5Qnc5eGJHYWVVck9FT2wyeUlDRFQzRUJWL09RVmFlS3JpRFV5MWhOSysvVXZBUGkyVmI4MXJjUmoyV3NBMjE5UDhnTm83L1dhWUhDWXBhOXVZSWtoejJrbGFpTlRrV1pwdGY5WmI5NHlnTzNVdDVkVnl1eTFZNEkwcENnYzRvczJobkEvYjlTRHJPSCs4ZlJTL3JVR3J6Z1ErZ0FBZy9jeEJNQVpoUDhnekg2S2tNbnpBd3gyOU1GK2JHVWphdHIwcmNGVzB4ZEhmc3k3SGxZS1p2RzkzR29NZ2xEOWhBTjdRRTBlQThLWGhpVFNpSXMvMlBDeFdPMHZYdlFyMVNaWUVScGdvR2cvcUdVSGRDMmUwYzhQZVF4c3NxZFVkR3hXdmxhMzJNREZLSEtLOGk5UW9rZGgzMHEwOGFvWWl2M29GNTE3S3Vqc3g4c3Zhdmo0cDFoRFZ5aEwzTm1kSExwVXBXRVR2NDJSUTVHM3hwQlRCczRFTDRPZzRmSFIxSEI1QUNvTmM0NVNlN2JZUEd3S3FHWUIrSUhSeXQ4cjNoK29QRnpCd05KckJzTk1vSXlEQUtKaGt2ck9WL29zZHZrR3EzMHhJSVp1NEZLbCtSSE8rMFVBT0xrckN3Qk5sWkRSdzJyQXZGWHhldTVmR3p3aEc2SUpDa250eTZzSUtxZEpNZlpjZ1VSV3BWaEZQUStCSHoxdlkrY2JEZkR6UWwvOHM0RnpoZTRCSzJRTCtBaW9HVDVsU1hkZ0NJQWwzYVp6OTZRaEFNNWQyUzdwa3cwQnNLVGJkTzZlTkFUQXVTdmJKWDJ5SVFDV2RKdk8zWk9HQURoM1pidWtUellFd0pKdTA3bDcwaEFBNTY1c2wvVEpoZ0JZMG0wNmQwOGFBdURjbGUyU1B0a1FBRXU2VGVmdVNVTUFuTHV5WGRJbkd3SmdTYmZwM0QxcENJQnpWN1pMK21UL0h3MUlyRHlNTjR1dUFBQUFBRWxGVGtTdVFtQ0MiLz4KICA8L3N2Zz4=',
        homepage: 'https://github.com/GetScatter',
        download: 'https://github.com/GetScatter/ScatterDesktop/releases',
    })
    /**
     * Performs the wallet logic required to login and return the chain and permission level to use.
     *
     * @param options WalletPluginLoginOptions
     * @returns Promise<WalletPluginLoginResponse>
     */
    login(context: LoginContext): Promise<WalletPluginLoginResponse> {
        return new Promise((resolve, reject) => {
            this.handleLogin(context)
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    async handleLogin(context: LoginContext): Promise<WalletPluginLoginResponse> {
        if (!context.ui) {
            throw new Error('No UI available')
        }

        // Retrieve translation helper from the UI, passing the app ID
        // const t = context.ui.getTranslate(this.id)

        const { account } = await this.getScatter(context)
        let chainId: string;
        if (account.chainId) {
            chainId = account.chainId
        } else if (account.blockchain && Object.keys(Chains).includes(account.blockchain.toUpperCase())) {
            chainId = Chains[account.blockchain.toUpperCase()].id
        } else {
            throw new Error('Unknown chain')
        }

        return {
            chain: Checksum256.from(chainId),
            permissionLevel: PermissionLevel.from(`${account.name}@${account.authority}`),
        }
    }

    async getScatter(context): Promise<{ account: ScatterAccount; connector: any }> {
        // Ensure connected
        const connected: boolean = await ScatterJS.connect(context.appName)
        if (!connected) {
            throw new Error('No Scatter Wallet')
        }

        // Setup network
        const url = new URL(context.chain.url)
        const network = ScatterJS.Network.fromJson({
            blockchain: 'default',
            chainId: String(context.chain.id),
            host: url.hostname,
            port: url.port,
            protocol: url.protocol.replace(':', ''),
        })

        // Ensure connection and get identity
        const scatterIdentity = await ScatterJS.login({ accounts: [network] })
        if (!scatterIdentity || !scatterIdentity.accounts) {
            throw new Error('Failed to login in scatter')
        }
        const account: ScatterAccount = scatterIdentity.accounts[0]

        // Establish connector
        const rpc = new JsonRpc(network.fullhost())
        rpc.getRequiredKeys = async () => [] // Hacky way to get around getRequiredKeys
        const connector = ScatterJS.eos(network, Api, { rpc })

        return {
            account,
            connector,
        }
    }

    /**
     * Performs the wallet logic required to sign a transaction and return the signature.
     *
     * @param chain ChainDefinition
     * @param resolved ResolvedSigningRequest
     * @returns Promise<Signature>
     */
    sign(
        resolved: ResolvedSigningRequest,
        context: TransactContext
    ): Promise<WalletPluginSignResponse> {
        return this.handleSignatureRequest(resolved, context)
    }

    private async handleSignatureRequest(
        resolved: ResolvedSigningRequest,
        context: TransactContext
    ): Promise<WalletPluginSignResponse> {
        if (!context.ui) {
            throw new Error('No UI available')
        }

        // Retrieve translation helper from the UI, passing the app ID
        // const t = context.ui.getTranslate(this.id)

        // Get the connector from Scatter
        const { connector } = await this.getScatter(context)

        // Convert the transaction to plain JS
        const plainTransaction = JSON.parse(JSON.stringify(resolved.resolvedTransaction))

        // Call transact on the connector
        const response = await connector.transact(plainTransaction, {
            broadcast: false,
        })

        // Get the response back (since the wallet may have modified the transaction)
        const modified = Serializer.decode({
            data: response.serializedTransaction,
            type: Transaction,
        })

        // Create the new request and resolve it
        const modifiedRequest = await SigningRequest.create(
            {
                transaction: modified,
            },
            context.esrOptions
        )
        const abis = await modifiedRequest.fetchAbis(context.abiCache)
        const modifiedResolved = modifiedRequest.resolve(abis, context.permissionLevel)

        // Return the modified request and the signatures from the wallet
        return {
            signatures: response.signatures,
            resolved: modifiedResolved,
        }
    }
}
