/* Cat Bond host adapter: browser portals now, native wrappers later.
 * This is presentation/lifecycle configuration, never a security boundary.
 * Keep gameplay, collection rules and save format independent from host.
 */
(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const named = (params.get('platform') || '').toLowerCase();
  const referrerHost = (() => {
    try { return new URL(document.referrer).hostname.toLowerCase(); }
    catch (_) { return ''; }
  })();
  const fromCrazyGames = /(^|\.)crazygames\.com$/.test(referrerHost);
  // A CrazyGames live iframe is submitted with utm_source=crazygames &
  // utm_medium=portal; it may have no referrer due to iframe privacy policy.
  const crazygames = named === 'crazygames' ||
    params.get('isCrazyGames') === 'true' ||
    fromCrazyGames ||
    (params.get('utm_source') === 'crazygames' && params.get('utm_medium') === 'portal');
  const native = !crazygames && ['steam', 'ios', 'android', 'native'].includes(named);
  const externalPortal = crazygames || named === 'portal' ||
    (!native && params.get('utm_medium') === 'portal');
  const host = crazygames ? 'crazygames' : native ? named : externalPortal ? 'portal' : 'web';
  const ownsFullscreen = crazygames || native;
  const platform = Object.freeze({
    host, crazygames, native, externalPortal, ownsFullscreen,
    // Portal pages use the host's reporting rather than a persistent
    // first-party visitor identifier, until consent/SDK integration exists.
    firstPartyAnalytics: !externalPortal,
  });
  window.CatBondPlatform = platform;
  if (crazygames) document.documentElement.classList.add('cb-cg');
  if (externalPortal) document.documentElement.classList.add('cb-third-party');
  if (native) document.documentElement.classList.add('cb-native-host');
})();
