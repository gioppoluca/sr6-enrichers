const LOG_PREFIX = "SR6E | Enricher";

import {getRollTypes} from "../api/system-api.mjs";
import {SR6Enricher} from "./SR6Enricher.mjs";

export class ActorRollEnricher extends SR6Enricher {
    static pattern = /@(Skill|Attribute)\[([^\]]+)\](?:\{([^}]+)\})?/g;
    static action = "actor-roll";

    static async enrich(match, _options) {
        const type = match[1];
        const definition = this.#parseDefinition(type, match[2]);

        if (!definition) {
            console.warn(`${LOG_PREFIX} | Invalid ${type} definition "${match[2]}"`);
            return this.createInvalidEnricher(match[0]);
        }

        const {target, threshold, secondary, specialization} = definition;

        const customLabel = match[3]?.trim();
        const label = customLabel || game.i18n.localize(
            specialization
                ? `shadowrun6.special.${target}.${specialization}`
                : type === "Skill" ? `skill.${target}` : `attrib.${target}`
        );
        const anchor = document.createElement("a");

        anchor.classList.add(
            "sr6-enricher-roll",
            `sr6-${type.toLowerCase()}-roll`
        );
        anchor.dataset.sr6EnricherAction = this.action;
        anchor.dataset.rollType = type;
        anchor.dataset.rollTarget = target;
        if (threshold !== undefined) anchor.dataset.threshold = threshold;
        if (secondary !== undefined) anchor.dataset.secondary = secondary;
        if (specialization !== undefined) anchor.dataset.skillSpecialization = specialization;

        const icon = document.createElement("i");
        icon.classList.add("fas", type === "Skill" ? "fa-dice-d6" : "fa-dice");
        anchor.append(icon, document.createTextNode(` ${label}`));
        return anchor;
    }

    static async handle(element, _event) {
        const rollType = element.dataset.rollType;
        const rollTarget = element.dataset.rollTarget;
        const threshold = this.#readThreshold(element.dataset.threshold);
        const secondary = element.dataset.secondary;
        const specialization = element.dataset.skillSpecialization;

        if (!rollType || !rollTarget || threshold === null) {
            console.warn(`${LOG_PREFIX} | Invalid actor roll data`, element.dataset);
            return;
        }

        switch (rollType) {
            case "Skill": {
                const actors = await this.resolveRollActors();
                for (const actor of actors) {
                    await this.#rollSkill(actor, rollTarget, specialization, threshold);
                }
                break;
            }

            case "Attribute": {
                const actors = await this.resolveRollActors();
                for (const actor of actors) {
                    await this.#rollAttribute(actor, rollTarget, secondary, threshold);
                }
                break;
            }

            default:
                console.warn(`Unsupported roll type "${rollType}"`);
        }
    }

    static #parseDefinition(type, source) {
        const [rawTarget, ...rawParameters] = source.split("|");
        const resolvedTarget = this.#resolveTarget(type, rawTarget.trim());
        if (!resolvedTarget) return null;

        const {target, specialization} = resolvedTarget;

        const parameters = this.#parseParameters(type, rawParameters);
        if (!parameters) return null;

        const threshold = this.#parseThreshold(parameters.threshold);
        if (threshold === null) return null;

        const resolvedSecondary = parameters.secondary === undefined
            ? undefined
            : this.#resolveTarget("Attribute", parameters.secondary);
        if (parameters.secondary !== undefined && !resolvedSecondary) return null;

        const secondary = resolvedSecondary?.target;
        return {target, threshold, secondary, specialization};
    }

    static #resolveTarget(type, rawTarget) {
        const candidate = rawTarget.toLowerCase();

        if (type === "Skill") {
            if (CONFIG.SR6.ATTRIB_BY_SKILL.has(candidate)) {
                return {target: candidate};
            }

            const matches = [];
            for (const [skillId, specializations] of Object.entries(CONFIG.SR6.skill_special)) {
                for (const [specializationId, localizationKey] of Object.entries(specializations)) {
                    const localizedName = game.i18n.localize(localizationKey).toLowerCase();
                    if (specializationId === candidate || localizedName === candidate) {
                        matches.push({target: skillId, specialization: specializationId});
                    }
                }
            }

            return matches.length === 1 ? matches[0] : null;
        }

        if (type === "Attribute") {
            return CONFIG.SR6.ATTRIBUTES.includes(candidate) ? {target: candidate} : null;
        }

        return null;
    }

    static #parseParameters(type, rawParameters) {
        const parameters = {};

        for (const rawParameter of rawParameters) {
            const separator = rawParameter.indexOf("=");
            if (separator < 1) return null;

            const key = rawParameter.slice(0, separator).trim();
            const value = rawParameter.slice(separator + 1).trim();
            const allowedParameters = type === "Attribute"
                ? ["threshold", "secondary"]
                : ["threshold"];
            if (!key || !value || key in parameters || !allowedParameters.includes(key)) return null;
            parameters[key] = value;
        }

        return parameters;
    }

    static #parseThreshold(value) {
        if (value === undefined) return undefined;
        if (!/^\d+$/.test(value)) return null;
        return Number(value);
    }

    static #readThreshold(value) {
        if (value === undefined) return undefined;
        const threshold = Number(value);
        return Number.isInteger(threshold) && threshold >= 0 ? threshold : null;
    }

    static async #rollSkill(actor, skillId, specialization, threshold) {
        if (!CONFIG.SR6.ATTRIB_BY_SKILL.has(skillId)) {
            console.warn(`Unsupported skill ID "${skillId}"`);
            return;
        }

        if (!actor.system.skills?.[skillId]) {
            console.warn(`Actor "${actor.name}" has no data for skill "${skillId}"`);
            return;
        }

        const {SkillRoll} = await getRollTypes();
        const roll = new SkillRoll(actor.system, skillId);
        if (specialization !== undefined) roll.skillSpec = specialization;
        if (threshold !== undefined) roll.threshold = threshold;
        return actor.rollSkill(roll);
    }

    static async #rollAttribute(actor, attributeId, secondaryId, threshold) {
        if (!CONFIG.SR6.ATTRIBUTES.includes(attributeId)) {
            console.warn(`Unsupported attribute "${attributeId}"`);
            return;
        }

        const primaryPool = this.#getAttributePool(actor, attributeId);
        if (!Number.isFinite(primaryPool)) {
            console.warn(`Actor "${actor.name}" does not have attribute "${attributeId}"`);
            return;
        }

        let pool = primaryPool;
        let checkText = game.i18n.localize(`attrib.${attributeId}`);

        if (secondaryId !== undefined) {
            if (!CONFIG.SR6.ATTRIBUTES.includes(secondaryId)) {
                console.warn(`Unsupported secondary attribute "${secondaryId}"`);
                return;
            }

            const secondaryPool = this.#getAttributePool(actor, secondaryId);
            if (!Number.isFinite(secondaryPool)) {
                console.warn(`Actor "${actor.name}" does not have attribute "${secondaryId}"`);
                return;
            }

            pool += secondaryPool;
            checkText += ` + ${game.i18n.localize(`attrib.${secondaryId}`)}`;
        }

        const {PreparedRoll, RollType} = await getRollTypes();
        const roll = new PreparedRoll();
        roll.pool = pool;
        roll.rollType = RollType.Common;
        roll.actionText = checkText;
        roll.checkText = checkText;
        roll.allowBuyHits = true;
        roll.useAttributeMod = true;
        roll.attributeTested = attributeId;
        if (secondaryId !== undefined) roll.attrib = secondaryId;
        if (threshold !== undefined) roll.threshold = threshold;

        return actor.rollCommonCheck(roll, {
            useModifier: true,
            useThreshold: true
        });
    }

    static #getAttributePool(actor, attributeId) {
        const key = actor.system instanceof foundry.abstract.DataModel
            ? CONFIG.SR6.ATTRIBUTE_TO_V2[attributeId]
            : attributeId;

        if (!key) return NaN;
        return Number(actor.system.attributes?.[key]?.pool);
    }
}
