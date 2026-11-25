import "./narrative-host.mjs";
import "./npc-world.mjs?v=sunlit-muling";
import "./ambient-play.mjs";
import "./world-runtime.mjs?v=guided-puzzles";
import "./title-entry.mjs?v=storybook-starters";
import "./garden-bell.mjs?v=sunlit-bell";
import "./chapter-cinematics.mjs";
import "./forge-combat-runtime.mjs?v=storybook-arenas";
import "./regional-combat.mjs?v=storybook-arenas";
import "./finale-combat.mjs?v=storybook-arenas";
import "./resonance-book.mjs";

window.__CAT_BOND_CANONICAL_RELEASE__ = true;
// Production entry may use approved shots or the explicitly authorized opening
// release list, never the integration-only candidate art bypass.
window.__CAT_BOND_INTEGRATION_ART__ = false;
window.WorldMap = window.CatBondCanonicalWorld;
