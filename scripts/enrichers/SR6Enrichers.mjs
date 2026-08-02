import {ActorInfoEnricher} from "./ActorInfoEnricher.mjs";
import {ActorRollEnricher} from "./ActorRollEnricher.mjs";
import {ItemInfoEnricher} from "./ItemInfoEnricher.mjs";
import {ConditionEnricher} from "./ConditionEnricher.mjs";
import {HostEnricher} from "./matrix/HostEnricher.mjs";
import {MatrixCheckEnricher} from "./matrix/MatrixCheckEnricher.mjs";
import {MatrixAttackEnricher} from "./matrix/MatrixAttackEnricher.mjs";

const ENRICHERS = [
    ActorInfoEnricher,
    ItemInfoEnricher,
    ActorRollEnricher,
    ConditionEnricher,
    HostEnricher,
    MatrixCheckEnricher,
    MatrixAttackEnricher
];

export class SR6Enrichers {
    static register() {
        let registered = 0;

        for (const enricher of ENRICHERS) {
            if (enricher.register()) registered += 1;
        }

        return registered;
    }

    static getStatus() {
        return ENRICHERS.map(enricher => ({
            name: enricher.name,
            pattern: `/${enricher.pattern.source}/${enricher.pattern.flags}`,
            registered: enricher.isRegistered()
        }));
    }

    static areRegistered() {
        return ENRICHERS.every(enricher => enricher.isRegistered());
    }
}
