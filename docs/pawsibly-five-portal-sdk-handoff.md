# Final SDK handoff (only real IDs)
Use the standalone candidate from the latest successful visual acceptance archive, not the old November 21 source or original website wrapper.

- Y8: `Y8_APP_ID=... Y8_GAME_ID=... python3 scripts/bind-pawsibly-portable-final.py /path/to/pawsibly-standalone-candidate.zip y8`. Y8_GAME_ID optional if ads disabled. Use real values from SDK Initialization of this game only.
- GameDistribution: `GD_GAME_ID=... python3 scripts/bind-pawsibly-portable-final.py /path/to/pawsibly-standalone-candidate.zip gd`. Use actual portal ID; test ad pause and resume in portal.
- GamePix: `python3 scripts/bind-pawsibly-portable-final.py /path/to/pawsibly-standalone-candidate.zip gamepix`. SDK-free variant also permitted; use SDK version if monetizing. No ads during gameplay; only natural next-room break after two wins and >=90 seconds since last request.
- CrazyGames: Basic Launch SDK-free candidate; no third-party SDK or monetization.
- itch.io: keep current wrapper if embedded live code is already up to date.

No private identifiers in source control, no payment, no automatic external publishing. Existing public itch listing discloses AI-assisted code, graphics and text; preserve truthful disclosure if requested by any portal.

Official references:
https://docs.y8.com/studio/sdk-initialization/
https://docs.y8.com/sdk/advertising/
https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation
https://partners.gamepix.com/sdk/doc/javascript
