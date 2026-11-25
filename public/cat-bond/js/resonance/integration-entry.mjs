import "./narrative-host.mjs";
import "./npc-world.mjs";
import "./ambient-play.mjs";
import "./world-runtime.mjs";
import "./title-entry.mjs";
import "./garden-bell.mjs";
import "./forge-combat-runtime.mjs";
import "./regional-combat.mjs";
import "./finale-combat.mjs";

window.__CAT_BOND_CANONICAL_RELEASE__ = true;
// Integration-only branch. Candidate shots never qualify through the release manifest.
window.__CAT_BOND_INTEGRATION_ART__ = true;
window.WorldMap = window.CatBondCanonicalWorld;
