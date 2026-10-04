export function diff(base: unknown, variant: unknown): unknown {
  if (base === variant) return undefined;
  
  if (Array.isArray(base) && Array.isArray(variant)) {
    if (JSON.stringify(base) === JSON.stringify(variant)) return undefined;
    // We treat array changes as a full replacement, OR we could do index-based diff.
    // Index-based diff:
    const changes: Record<string, unknown> = {};
    const max = Math.max(base.length, variant.length);
    for (let i = 0; i < max; i++) {
      const b = base[i];
      const v = variant[i];
      const d = diff(b, v);
      if (d !== undefined) {
        changes[i] = v === undefined ? null : d;
      }
    }
    // We store array diffs as objects with numeric string keys, and a special _isArray flag to know it patches an array
    if (Object.keys(changes).length > 0) {
      changes["_isArray"] = true;
      if (variant.length !== base.length) {
        changes["_length"] = variant.length;
      }
      return changes;
    }
    return undefined;
  }
  
  if (typeof base === 'object' && typeof variant === 'object' && base !== null && variant !== null) {
    const changes: Record<string, unknown> = {};
    const allKeys = new Set([...Object.keys(base), ...Object.keys(variant)]);
    for (const key of allKeys) {
      const b = (base as Record<string, unknown>)[key];
      const v = (variant as Record<string, unknown>)[key];
      const d = diff(b, v);
      if (d !== undefined) {
         changes[key] = v === undefined ? null : d;
      }
    }
    return Object.keys(changes).length > 0 ? changes : undefined;
  }
  
  return variant === undefined ? null : variant;
}

export function patch(base: unknown, changes: unknown): unknown {
  if (changes === undefined) return base;
  if (changes === null) return undefined;
  
  if (typeof changes === 'object' && changes !== null) {
    const changesObj = changes as Record<string, unknown>;
    
    if (changesObj["_isArray"] === true) {
      const baseArr = Array.isArray(base) ? [...base] : [];
      const len = changesObj["_length"] !== undefined ? (changesObj["_length"] as number) : baseArr.length;
      
      const result: unknown[] = [];
      for (let i = 0; i < len; i++) {
        const c = changesObj[String(i)];
        if (c !== undefined) {
          const patched = patch(baseArr[i], c);
          if (patched !== undefined) result.push(patched);
        } else {
          if (baseArr[i] !== undefined) result.push(baseArr[i]);
        }
      }
      return result;
    }
    
    const baseObj = (typeof base === 'object' && base !== null && !Array.isArray(base)) 
      ? base as Record<string, unknown> 
      : {};
      
    const result: Record<string, unknown> = { ...baseObj };
    for (const [key, value] of Object.entries(changesObj)) {
      const patched = patch(result[key], value);
      if (patched === undefined) {
        delete result[key];
      } else {
        result[key] = patched;
      }
    }
    return result;
  }
  
  return changes;
}

const base = {
  basics: { name: "Alice", email: "alice@example.com" },
  work: [{ company: "A" }, { company: "B" }]
};

const variant = {
  basics: { name: "Alice", email: "alice@variants.com", phone: "123" },
  work: [{ company: "A", position: "Dev" }] // deleted second item, added position to first
};

const d = diff(base, variant);
console.log("DIFF:", JSON.stringify(d, null, 2));
const p = patch(base, d);
console.log("PATCHED:", JSON.stringify(p, null, 2));
