import type { Abi } from "viem";

import erc20AbiJson from "./abi/ERC20.json";
import ercs20TokenAbiJson from "./abi/ERCS20.json";
import ercs20FactoryAbiJson from "./abi/ERCS20Factory.json";
import globalSpotVaultAbiJson from "./abi/GlobalSpotVault.json";
import spotPairFactoryAbiJson from "./abi/SpotPairFactory.json";

/** Standard ERC-20 — sync from `lib/contracts/abi/ERC20.json`. */
export const erc20Abi = erc20AbiJson as Abi;

/** ERCS20 token — sync from `lib/contracts/abi/ERCS20.json`. */
export const ercs20TokenAbi = ercs20TokenAbiJson as Abi;

/** ERCS20Factory — sync from `lib/contracts/abi/ERCS20Factory.json`. */
export const ercs20FactoryAbi = ercs20FactoryAbiJson as Abi;

/** GlobalSpotVault — sync from `lib/contracts/abi/GlobalSpotVault.json`. */
export const globalSpotVaultAbi = globalSpotVaultAbiJson as Abi;

/** SpotPairFactory — sync from `lib/contracts/abi/SpotPairFactory.json`. */
export const spotPairFactoryAbi = spotPairFactoryAbiJson as Abi;

/** Alias for `globalSpotVaultAbi`. */
export const assetVaultAbi = globalSpotVaultAbi;
