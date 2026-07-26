import {SR6Enricher} from "./SR6Enricher.mjs";

export class ConditionEnricher extends SR6Enricher {
    static pattern = /@Condition\[([^\]]+)\]/gi;

    static async enrich(match, _options) {
        const rawTarget = match[1].trim();
        const condition = CONFIG.statusEffects.find(
            effect => effect.id?.toLowerCase() === rawTarget.toLowerCase()
        );

        if (!condition) {
            this.warn(`Invalid Condition target "${rawTarget}"`);
            return this.createInvalidEnricher(match[0]);
        }

        const label = game.i18n.localize(condition.name);
        const span = document.createElement("span");
        span.classList.add("sr6-enricher-condition");
        span.dataset.condition = condition.id;
        span.dataset.tooltip = label;

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-info-circle");
        span.append(icon, document.createTextNode(` ${label}`));
        return span;
    }
}
