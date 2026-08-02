- ![](https://img.shields.io/badge/Foundry-v13-informational)![](https://img.shields.io/badge/Foundry-v14-informational)
- ![Latest Release Download Count](https://img.shields.io/github/downloads/gioppoluca/sr6-enrichers/latest/module.zip)
- ![Total Download Count](https://img.shields.io/github/downloads/gioppoluca/sr6-enrichers/total?color=d1b124&label=Total%20Download)
- ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fsr6-enrichers&colorB=4aa94a)

# SR6 Enrichers

A Foundry VTT module that adds interactive text enrichers for the **Shadowrun 6th Edition Eden** system.

The module allows Journal Entries, Item descriptions, Actor biographies and any other enriched text to become interactive by embedding Shadowrun actions directly inside the text.

The module is completely independent from the Shadowrun system and does not modify any system files.

---

# Requirements

- Foundry VTT 13 or 14
- Shadowrun6-eden 4.0+

---

# Features

Current enrichers:

- Skill rolls
- Attribute rolls
- Matrix actions
- Matrix attacks
- Matrix Hosts
- Conditions
- Actor information popovers
- Item information popovers

---

# General Notes

Enrichers automatically calculate everything that can be derived from the Actor.

Do **not** specify dice pools inside the Journal.

Only specify:

- the action
- the skill
- the attributes
- thresholds
- hosts
- targets

The Shadowrun system performs the actual calculations.

---

# Skill Rolls

Execute a Skill test.

## Syntax

```text
@Skill[skill]
```

Example

```text
@Skill[athletics]
```

---

## Custom Label

```text
@Skill[athletics]{Climb the Fence}
```

---

## Threshold

```text
@Skill[athletics|threshold=3]
```

or

```text
@Skill[athletics|threshold=3]{Climb the Fence}
```

---

## Specializations

The enricher accepts:

- Skill IDs

or

- Specialization IDs

or

- Localized specialization names

Example

```text
@Skill[Intimidation]
```

```text
@Skill[Intimidation|threshold=3]{Silent Threat}
```

The enricher automatically resolves the parent skill.

---

# Attribute Rolls

Execute an Attribute test.

## Syntax

```text
@Attribute[attribute]
```

Example

```text
@Attribute[logic]
```

---

## Threshold

```text
@Attribute[logic|threshold=3]
```

---

## Secondary Attribute

Some Shadowrun tests use two attributes.

```text
@Attribute[logic|secondary=will]
```

Example

```text
@Attribute[reaction|secondary=intuition]
```

---

## Secondary Attribute with Threshold

```text
@Attribute[reaction|secondary=intuition|threshold=2]
```

---

## Custom Label

```text
@Attribute[logic]{Remember Details}
```

---

# Conditions

Display a condition.

## Syntax

```text
@Condition[Stun]
```

Example

```text
@Condition[Blinded]
```

---

# Matrix Hosts

Define a Matrix Host inside a Journal.

Hosts are reusable.

Once defined they can be referenced by Matrix actions.

## Syntax

```text
@Host[
host-id
|attack=7
|sleaze=6
|dataProcessing=8
|firewall=9
]{Renraku Arcology Host}
```

Example

```text
@Host[
renraku
|attack=7
|sleaze=8
|dataProcessing=8
|firewall=9
]{Renraku Arcology Host}
```

---

# Matrix Checks

Execute Matrix actions.

The enricher supports two Host sources.

## 1. Host Actor

If an Actor of type **Host** exists:

```text
@MatrixCheck[
probe
|host=Renraku Arcology
]
```

or

```text
@MatrixCheck[
probe
|host=Actor.xxxxxxxxx
]
```

The Actor is resolved automatically.

---

## 2. Journal Host

If no Host Actor is found the enricher searches for a previously defined Journal Host.

```text
@MatrixCheck[
probe
|host=renraku
]
```

where

```text
@Host[
renraku
|attack=7
|sleaze=8
|dataProcessing=8
|firewall=9
]{Renraku}
```

exists in the same Journal.

---

## Host Defense Actions

These automatically roll the Host defense.

Examples

```text
@MatrixCheck[probe|host=renraku]
```

```text
@MatrixCheck[backdoor_entry|host=renraku]
```

```text
@MatrixCheck[brute_force|host=renraku]
```

```text
@MatrixCheck[matrix_perception|host=renraku]
```

---

## Threshold Actions

Some Matrix actions require a fixed threshold instead of a Host defense.

Example

```text
@MatrixCheck[
edit_file
|host=renraku
|threshold=3
]{Alter Security Footage}
```

Example

```text
@MatrixCheck[
control_device
|host=renraku
|threshold=2
]{Operate Crane}
```

---

# Matrix Attack

Execute Matrix attacks against a predefined target.

Currently supported:

- Data Spike

## Syntax

```text
@MatrixAttack[
data_spike
|targets=Scene.xxx.Token.yyy
]
```

Example

```text
@MatrixAttack[
data_spike
|targets=Scene.xxxxx.Token.yyyyy
]{Crash the Drone}
```

The UUID must reference a Token in the currently active Scene.

---

# Actor Information

Display a rich Actor popover.

Supports:

- Actor name

or

- Actor UUID

## By Name

```text
@Actor(Eve)
```

---

## By UUID

```text
@Actor(Actor.xxxxxxxxx)
```

---

## Custom Label

```text
@Actor(Eve){Johnson}
```

---

## Popover

The Actor popover currently displays

- Portrait
- Open Image
- Share Image (GM only)

---

# Item Information

Display a rich Item popover.

Supports:

- Item name
- Item UUID

## By Name

```text
@Item(Ares Predator VI)
```

---

## By UUID

```text
@Item(Item.xxxxxxxxx)
```

---

## Custom Label

```text
@Item(Ares Predator VI){Heavy Pistol}
```

---

## Popover

The Item popover currently displays

- Item image
- Open image
- Share image (GM only)
- Item description

Descriptions are enriched recursively, therefore nested enrichers are supported.

---

# GM Actor Selection

When a roll requires an Actor:

Players

- use their controlled token.

GM

If no token is controlled, the module displays an Actor selection dialog.

The list contains every Actor present in the Scene.

Player Characters are shown before NPCs.

---

# Error Handling

The module never throws errors into Journal text.

Instead it renders descriptive messages such as

```

Actor not found

```

or

```

Multiple Actors found. Please use an Actor UUID.

```

---

# Best Practices

Prefer UUIDs whenever possible.

Actor names are convenient during authoring but UUIDs remain valid after renaming.


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

