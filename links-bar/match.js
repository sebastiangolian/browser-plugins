// Site pattern matching shared by the content script.
// - "example.com"        → exact host (any port)
// - "localhost:8124"     → exact host and port
// - "*.example.com"      → example.com and all its subdomains
// - "github.com/org/*"   → host + path (pattern contains a path), "*" matches anything
// A leading scheme ("https://") and a bare trailing "/" are ignored.
(function (root) {
  function patternToRegExp(pattern) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i");
  }

  function normalizePattern(pattern) {
    return pattern
      .trim()
      .replace(/^[a-z]+:\/\//i, "")
      .replace(/^([^/]*)\/$/, "$1");
  }

  function matchesSite(pattern, location) {
    const normalized = normalizePattern(pattern);
    if (!normalized) return false;

    const hosts = [location.host, location.hostname];

    if (normalized.includes("/")) {
      const regExp = patternToRegExp(normalized);
      return hosts.some((host) => regExp.test(host + location.pathname));
    }

    if (normalized.startsWith("*.")) {
      const bareDomain = normalized.slice(2).toLowerCase();
      if (hosts.some((host) => host.toLowerCase() === bareDomain)) return true;
    }
    const regExp = patternToRegExp(normalized);
    return hosts.some((host) => regExp.test(host));
  }

  function matchesAnySite(patterns, location) {
    return patterns.some((pattern) => matchesSite(pattern, location));
  }

  const api = { matchesSite, matchesAnySite };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.LinksBarMatch = api;
  }
})(this);
