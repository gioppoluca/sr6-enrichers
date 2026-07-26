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
