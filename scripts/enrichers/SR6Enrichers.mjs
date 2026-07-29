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
        for (const enricher of ENRICHERS) {
            enricher.register();
        }
    }
}
