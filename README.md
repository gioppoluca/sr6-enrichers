- ![](https://img.shields.io/badge/Foundry-v13-informational)![](https://img.shields.io/badge/Foundry-v14-informational)
- ![Latest Release Download Count](https://img.shields.io/github/downloads/gioppoluca/sr6-enrichers/latest/module.zip)
- ![Total Download Count](https://img.shields.io/github/downloads/gioppoluca/sr6-enrichers/total?color=d1b124&label=Total%20Download)
- ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fsr6-enrichers&colorB=4aa94a)

# SR6 Enrichers

Standalone Foundry VTT module providing interactive text enrichers for the `shadowrun6-eden` system.

## Supported syntax

```text
@Actor(Actor name)
@Actor(Actor.uuid){Custom label}

@Skill[skill]
@Skill[skill|threshold=N]
@Skill[specialization|threshold=N]{Label}

@Attribute[attribute]
@Attribute[attribute|secondary=attribute]
@Attribute[attribute|secondary=attribute|threshold=N]{Label}

@Condition[condition]

@Host[id|attack=N|sleaze=N|dataProcessing=N|firewall=N]{Label}

@MatrixCheck[action|host=id]
@MatrixCheck[action|host=id|threshold=N]{Label}

@MatrixAttack[data_spike|targets=Scene.sceneId.Token.tokenId]{Label}
```

`@Actor(...)` resolves an Actor by exact, case-insensitive world name or by UUID. Duplicate names require an UUID. The interactive popover displays the portrait, opens it through Foundry ImagePopout, and lets GMs show it to connected players.

`control_device` and `edit_file` require `threshold`.

## Compatibility

Foundry VTT 13 and 14 with the `shadowrun6-eden` system.

## Installation

Copy the `sr6-enrichers` folder into Foundry's `Data/modules` directory, restart Foundry, and enable **SR6 Enrichers** in the world.


## Changelog

[Changelog](CHANGELOG.md)

## Support

Please open issues on this repo for any problems that you can have using this module.
For discussing on my modules please join my [discord server:](https://discord.gg/FgKtjFRn3e)

If you want to support this work
<a href="https://www.buymeacoffee.com/lucagioppo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

