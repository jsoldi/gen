type GenLike<T> = Gen<T> | T[] | AsyncGenerator<T, void, undefined> | (() => AsyncGenerator<T, void, undefined>)
type PromiseLike<T> = Promise<T> | T

export class Gen<T> {
    constructor(private readonly gen: AsyncGenerator<T, void, undefined>) { }

    pipe<R>(map: (gen: AsyncGenerator<T, void, undefined>) => AsyncGenerator<R, void, undefined>) {
        return new Gen(map(this.gen));
    }

    take(count: number) {
        return this.pipe(async function*(gen) {
            let i = 0;

            for await (let item of gen) {
                yield item;
    
                if (++i >= count)
                    break;
            }            
        });
    }

    async toArray() {
        const result: T[] = [];

        for await (let item of this.gen)
            result.push(item);

        return result;
    }

    map<R>(map: (item: T) => PromiseLike<R>) {
        return this.pipe(async function*(gen) {
            for await (let item of gen)
                yield await map(item);
        });
    }

    flatMap<R>(map: (item: T) => PromiseLike<GenLike<R>>): Gen<R> {
        return this.pipe(async function*(gen) {
            for await (let item of gen) {
                const child = await map(item);
                yield* Gen.from(child).gen;
            }
        });
    }

    filter(pred: (item: T) => PromiseLike<boolean>) {
        return this.pipe(async function*(gen) {
            for await (let item of gen)
                if (await pred(item))
                    yield item;
        });
    }

    takeWhile(pred: (item: T) => PromiseLike<boolean>) {
        return this.pipe(async function*(gen) {
            for await (let item of gen) {
                if (!await pred(item))
                    break;

                yield item;
            }
        });
    }

    skipWhile(pred: (item: T) => PromiseLike<boolean>) {
        return this.pipe(async function*(gen) {
            let skipping = true;

            for await (let item of gen) {
                if (skipping && !await pred(item))
                    skipping = false;

                if (!skipping)
                    yield item;
            }
        });
    }

    distinctBy<K>(key: (item: T) => PromiseLike<K>) {
        const seen = new Set<K>();

        return this.pipe(async function*(gen) {
            for await (let item of gen) {
                const k = await key(item);

                if (!seen.has(k)) {
                    seen.add(k);
                    yield item;
                }
            }
        });
    }

    static from<T>(genLike: GenLike<T>) {
        if (genLike instanceof Gen)
            return genLike;
        if (Array.isArray(genLike)) {
            return new Gen((async function*() {
                for (let i = 0; i < genLike.length; i++)
                    yield genLike[i];
            })());
        }
        else if (typeof genLike === 'function')
            return new Gen(genLike());
        else
            return new Gen(genLike);
    }

    static recur<T>(func: (prev?: T) => PromiseLike<T | undefined>) {
        return new Gen((async function*() {
            let prev: T | undefined = undefined;

            while (true) {
                const result: T | undefined = await func(prev);

                if (!result)
                    break;

                prev = result;
                yield result;
            }
        })());
    }
}
