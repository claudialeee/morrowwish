import "./narrative-host.mjs";
import "./npc-world.mjs?v=player-first-opening-2";
import "./ambient-play.mjs";
import "./world-runtime.mjs?v=player-first-nav-3";
import "./title-entry.mjs?v=player-first-opening-2";
import "./garden-bell.mjs?v=sunlit-bell";
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
