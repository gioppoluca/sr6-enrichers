import {getRollTypes} from "../../api/system-api.mjs";
import {SR6Enricher} from "../SR6Enricher.mjs";

const LOG_PREFIX = "SR6E | Enricher";
const TOKEN_UUID_PATTERN = /^Scene\.[^.]+\.Token\.[^.]+$/;

export class MatrixAttackEnricher extends SR6Enricher {
    static pattern = /@MatrixAttack\[([^\]]+)\](?:\{([^}]+)\})?/g;
    static action = "matrix-attack";

    static async enrich(match, _options) {
        const attack = this.#parseAttack(match[1]);

        if (!attack) {
            console.warn(`${LOG_PREFIX} | Invalid MatrixAttack definition "${match[1]}"`);
            return this.createInvalidEnricher(match[0]);
        }

        const actionLabel = game.i18n.localize(
            `shadowrun6.matrixaction.${attack.actionId}.name`
        );
        const label = match[2]?.trim() || actionLabel;
        const anchor = document.createElement("a");

        anchor.classList.add("sr6-enricher-roll", "sr6-matrix-attack");
        anchor.dataset.sr6EnricherAction = this.action;
        anchor.dataset.matrixAction = attack.actionId;
        anchor.dataset.targetUuids = attack.targetUuids.join(",");

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-bolt");

        anchor.append(icon, document.createTextNode(` ${label}`));
        return anchor;
    }

    static async handle(element, _event) {
        const actionId = element.dataset.matrixAction;
        const targetUuids = element.dataset.targetUuids
            ?.split(",")
            .map(uuid => uuid.trim())
            .filter(Boolean) ?? [];

        if (actionId !== "data_spike" || !targetUuids.length) {
            console.warn(`${LOG_PREFIX} | Invalid MatrixAttack data`, element.dataset);
            return;
        }

        const targetDocuments = [];

        for (const uuid of targetUuids) {
            const tokenDocument = await fromUuid(uuid);

            if (
                tokenDocument?.documentName !== "Token" ||
                tokenDocument.parent?.id !== canvas.scene?.id ||
                !tokenDocument.object
            ) {
                ui.notifications.warn(`Matrix attack target "${uuid}" is not available on the current scene.`);
                return;
            }

            targetDocuments.push(tokenDocument);
        }

        const actors = await this.resolveRollActors();
        if (!actors.length) return;

        game.user.updateTokenTargets(targetDocuments.map(token => token.id));

        const action = CONFIG.SR6.MATRIX_ACTIONS.data_spike;
        if (!action) {
            console.warn(`${LOG_PREFIX} | Matrix action "data_spike" is not configured`);
            return;
        }

        for (const actor of actors) {
            const {MatrixActionRoll} = await getRollTypes();
            const roll = new MatrixActionRoll(actor.system, action);
            await actor.performMatrixAction(roll);
        }
    }

    static #parseAttack(source) {
        const [rawActionId, ...rawParameters] = source.split("|");
        const actionId = rawActionId.trim().toLowerCase();
        if (actionId !== "data_spike") return null;

        const parameters = this.#parseParameters(rawParameters);
        if (!parameters || Object.keys(parameters).some(key => key !== "targets")) {
            return null;
        }

        const targetUuids = parameters.targets
            ?.split(",")
            .map(uuid => uuid.trim())
            .filter(Boolean);

        if (!targetUuids?.length) return null;
        if (targetUuids.some(uuid => !TOKEN_UUID_PATTERN.test(uuid))) return null;

        return {actionId, targetUuids};
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
}
