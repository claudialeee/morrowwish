import "./narrative-host.mjs";
import "./npc-world.mjs?v=garden-v3-1";
import "./ambient-play.mjs";
import "./world-runtime.mjs?v=starbell-ceremony-20261127";
import "./title-entry.mjs?v=map-talk-1";
// The prologue uses living discoveries instead of a standalone bell prop.
import "./chapter-cinematics.mjs";
import "./forge-combat-runtime.mjs?v=storybook-arenas";
import "./regional-combat.mjs?v=dedicated-watercolor-monsters-20261125";
import "./finale-combat.mjs?v=storybook-arenas";
import "./resonance-book.mjs";

window.__CAT_BOND_CANONICAL_RELEASE__ = true;
// Production entry may use approved shots or the explicitly authorized opening
// release list, never the integration-only candidate art bypass.
window.__CAT_BOND_INTEGRATION_ART__ = false;
window.WorldMap = window.CatBondCanonicalWorld;

import "./developer-preview.mjs";
