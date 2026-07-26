const LOG_PREFIX = "SR6E | Enricher";

import {getRollTypes} from "../../api/system-api.mjs";
import {SR6Enricher} from "../SR6Enricher.mjs";
import {HostEnricher} from "./HostEnricher.mjs";

const ACTION_MODES = {
    probe: "hostDefense",
    backdoor_entry: "hostDefense",
    brute_force: "hostDefense",
    matrix_perception: "hostDefense",
    control_device: "threshold",
    edit_file: "threshold"
};

export class MatrixCheckEnricher extends SR6Enricher {
    static pattern = /@MatrixCheck\[([^\]]+)\](?:\{([^}]+)\})?/g;
    static action = "matrix-check";

    static async enrich(match, _options) {
        const check = this.#parseCheck(match[1]);

        if (!check) {
            console.warn(`Invalid MatrixCheck definition "${match[1]}"`);
            return this.createInvalidEnricher(match[0]);
        }

        const customLabel = match[2]?.trim();
        const actionLabel = game.i18n.localize(
            `shadowrun6.matrixaction.${check.actionId}.name`
        );
        const anchor = document.createElement("a");
        anchor.classList.add("sr6-enricher-roll", "sr6-matrix-check");
        anchor.dataset.sr6EnricherAction = this.action;
        anchor.dataset.matrixAction = check.actionId;
        anchor.dataset.hostId = check.hostId;
        if (check.threshold !== undefined) anchor.dataset.threshold = check.threshold;
        anchor.dataset.customLabel = customLabel ? "true" : "false";

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-network-wired");
        const label = document.createElement("span");
        label.classList.add("sr6-matrix-check-label");
        label.textContent = customLabel || `${actionLabel}: ${check.hostId}`;

        anchor.append(icon, document.createTextNode(" "), label);
        return anchor;
    }

    static async handle(element, _event) {
        const actionId = element.dataset.matrixAction;
        const hostId = element.dataset.hostId;
        const threshold = this.#readThreshold(element.dataset.threshold);

        if (!actionId || !hostId || threshold === null) {
            console.warn(`${LOG_PREFIX} | Invalid MatrixCheck data`, element.dataset);
            return;
        }

        const action = CONFIG.SR6.MATRIX_ACTIONS[actionId];
        if (!action || !action.skill) {
            console.warn(`Unsupported Matrix action "${actionId}"`);
            return;
        }

        const host = HostEnricher.resolve(element, hostId);
        if (!host) {
            ui.notifications.warn(`SR6E | Host "${hostId}" was not found on this Journal Page.`);
            return;
        }

        const actors = await this.resolveRollActors();
        if (!actors.length) return;

        let actionThreshold = threshold;

        if (actionThreshold === undefined) {
            const defensePool = this.#getDefensePool(action, host);
            if (!Number.isFinite(defensePool)) {
                console.warn(`${LOG_PREFIX} | Cannot calculate Host defense for "${actionId}"`);
                return;
            }

            const defenseRoll = await new Roll(`${defensePool}d6cs>=5`).evaluate();
            const actionLabel = game.i18n.localize(
                `shadowrun6.matrixaction.${actionId}.name`
            );
            await defenseRoll.toMessage({flavor: `${host.label}: ${actionLabel}`});
            actionThreshold = defenseRoll.total;
        }

        const hostAction = foundry.utils.deepClone(action);
        hostAction.threshold = actionThreshold;
        hostAction.opposedAttr1 = null;
        hostAction.opposedAttr2 = null;

        for (const actor of actors) {
            const {MatrixActionRoll} = await getRollTypes();
            const roll = new MatrixActionRoll(actor.system, hostAction);

            if (actionId === "probe") {
                roll.extended = true;
                roll.interval = 1;
            }

            await actor.performMatrixAction(roll);
        }
    }

    static updateLabels(html) {
        const root = html instanceof HTMLElement ? html : html?.[0];
        if (!(root instanceof HTMLElement)) return;

        for (const element of root.querySelectorAll(".sr6-matrix-check")) {
            if (!(element instanceof HTMLElement)) continue;
            if (element.dataset.customLabel === "true") continue;

            const actionId = element.dataset.matrixAction;
            const hostId = element.dataset.hostId;
            if (!actionId || !hostId) continue;

            const host = HostEnricher.resolve(element, hostId);
            if (!host) continue;

            const label = element.querySelector(".sr6-matrix-check-label");
            if (!(label instanceof HTMLElement)) continue;

            const actionLabel = game.i18n.localize(
                `shadowrun6.matrixaction.${actionId}.name`
            );
            label.textContent = `${actionLabel}: ${host.label}`;
        }
    }

    static #parseCheck(source) {
        const [rawActionId, ...rawParameters] = source.split("|");
        const actionId = rawActionId.trim().toLowerCase();
        const parameters = this.#parseParameters(rawParameters);
        if (!parameters) return null;

        const hostId = parameters.host?.toLowerCase();
        const threshold = this.#parseThreshold(parameters.threshold);

        const actionMode = ACTION_MODES[actionId];
        if (!actionMode) return null;
        if (!CONFIG.SR6.MATRIX_ACTIONS[actionId]) return null;
        if (!hostId || !/^[a-z0-9-]+$/.test(hostId)) return null;
        if (threshold === null) return null;
        if (actionMode === "threshold" && threshold === undefined) return null;
        if (Object.keys(parameters).some(key => !["host", "threshold"].includes(key))) return null;
        return {actionId, hostId, threshold};
    }

    static #parseParameters(rawParameters) {
        const parameters = {};

        for (const rawParameter of rawParameters) {
            const separator = rawParameter.indexOf("=");
            if (separator < 1) return null;

            const key = rawParameter.slice(0, separator).trim();
            const value = rawParameter.slice(separator + 1).trim();
            if (!key || !value || key in parameters) return null;
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

    static #getDefensePool(action, host) {
        const first = this.#getHostAttribute(host, action.opposedAttr1);
        const second = this.#getHostAttribute(host, action.opposedAttr2);

        if (first !== null && second !== null) return first + second;
        if (first !== null) return first * 2;
        if (second !== null) return second * 2;
        return null;
    }

    static #getHostAttribute(host, attributeId) {
        switch (attributeId) {
            case "a": return host.attack;
            case "s": return host.sleaze;
            case "d": return host.dataProcessing;
            case "f": return host.firewall;
            default: return null;
        }
    }
}
