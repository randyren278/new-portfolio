/* Local compatibility adapter; renderer factories are unchanged. */
window.ReferenceModules = (() => {
  const factories = new Map(), cache = new Map();
  function require(id) {
    if (cache.has(id)) return cache.get(id);
    const exports = {}; cache.set(id, exports);
    const factory = factories.get(id);
    if (!factory) throw new Error(`Missing reference module ${id}`);
    factory({i: require, s(table, alias) {
      const target = alias == null ? exports : (cache.get(alias) || {});
      if (alias != null) cache.set(alias, target);
      for (let i = 0; i < table.length;) {
        const name = table[i++], value = table[i++];
        if (value === 0) Object.defineProperty(target, name, {value:table[i++], enumerable:true});
        else Object.defineProperty(target, name, {get:value, enumerable:true});
      }
    }});
    return exports;
  }
  return {register(id, factory) { factories.set(id, factory); }, require,
    override(id, value) { cache.set(id, value); }};
})();
