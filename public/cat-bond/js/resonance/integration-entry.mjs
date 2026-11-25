import "./narrative-host.mjs";
import "./npc-world.mjs";
import "./ambient-play.mjs";
import "./world-runtime.mjs";
import "./title-entry.mjs";
import "./garden-bell.mjs";
import "./chapter-cinematics.mjs";
import "./forge-combat-runtime.mjs";
import "./regional-combat.mjs";
import "./finale-combat.mjs";

window.__CAT_BOND_CANONICAL_RELEASE__ = true;
// Production entry may use approved shots or the explicitly authorized opening
// release list, never the integration-only candidate art bypass.
window.__CAT_BOND_INTEGRATION_ART__ = false;
window.WorldMap = window.CatBondCanonicalWorld;
