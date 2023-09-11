export class Gen {
    constructor(gen) {
        this.gen = gen;
    }
    [Symbol.asyncIterator]() {
        return this.gen;
    }
    pipe(map) {
        return new Gen(map(this.gen));
    }
    take(count) {
        return this.pipe(async function* (gen) {
            let i = 0;
            for await (let item of gen) {
                yield item;
                if (++i >= count)
                    break;
            }
        });
    }
    do(action) {
        return this.pipe(async function* (gen) {
            for await (let item of gen) {
                action(item);
                yield item;
            }
        });
    }
    async toArray() {
        const result = [];
        for await (let item of this.gen)
            result.push(item);
        return result;
    }
    map(map) {
        return this.pipe(async function* (gen) {
            for await (let item of gen)
                yield await map(item);
        });
    }
    flatMap(map) {
        return this.pipe(async function* (gen) {
            for await (let item of gen) {
                const child = await map(item);
                yield* Gen.from(child).gen;
            }
        });
    }
    filter(pred) {
        return this.pipe(async function* (gen) {
            for await (let item of gen)
                if (await pred(item))
                    yield item;
        });
    }
    takeWhile(pred) {
        return this.pipe(async function* (gen) {
            for await (let item of gen) {
                if (!await pred(item))
                    break;
                yield item;
            }
        });
    }
    skipWhile(pred) {
        return this.pipe(async function* (gen) {
            let skipping = true;
            for await (let item of gen) {
                if (skipping && !await pred(item))
                    skipping = false;
                if (!skipping)
                    yield item;
            }
        });
    }
    distinctBy(key) {
        const seen = new Set();
        return this.pipe(async function* (gen) {
            for await (let item of gen) {
                const k = await key(item);
                if (!seen.has(k)) {
                    seen.add(k);
                    yield item;
                }
            }
        });
    }
    static from(genLike) {
        if (genLike instanceof Gen)
            return genLike;
        if (Array.isArray(genLike)) {
            return new Gen((async function* () {
                for (let i = 0; i < genLike.length; i++)
                    yield genLike[i];
            })());
        }
        else if (typeof genLike === 'function')
            return new Gen(genLike());
        else
            return new Gen(genLike);
    }
    static recur(func) {
        return new Gen((async function* () {
            let prev = undefined;
            while (true) {
                const result = await func(prev);
                if (!result)
                    break;
                prev = result;
                yield result;
            }
        })());
    }
}
//# sourceMappingURL=index.js.map