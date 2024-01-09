type GenLike<T> = Gen<T> | T[] | AsyncGenerator<T, void, undefined> | (() => AsyncGenerator<T, void, undefined>)
type Awaitable<T> = Promise<T> | T

export class Gen<T> implements AsyncIterable<T> {
    constructor(private readonly gen: AsyncGenerator<T, void, undefined>) { }

    [Symbol.asyncIterator]() {
        return this.gen;
    }

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

    do(action: (item: T) => unknown) {
        return this.pipe(async function*(gen) {
            for await (let item of gen) {
                action(item);
                yield item;
            }
        });
    }

    async toArray() {
        const result: T[] = [];

        for await (let item of this.gen)
            result.push(item);

        return result;
    }

    map<R>(map: (item: T) => Awaitable<R>) {
        return this.pipe(async function*(gen) {
            for await (let item of gen)
                yield await map(item);
        });
    }

    flatMap<R>(map: (item: T) => Awaitable<GenLike<R>>): Gen<R> {
        return this.pipe(async function*(gen) {
            for await (let item of gen) {
                const child = await map(item);
                yield* Gen.from(child).gen;
            }
        });
    }

    filter(pred: (item: T) => Awaitable<unknown>) {
        return this.pipe(async function*(gen) {
            for await (let item of gen)
                if (await pred(item))
                    yield item;
        });
    }

    takeWhile(pred: (item: T) => Awaitable<unknown>) {
        return this.pipe(async function*(gen) {
            for await (let item of gen) {
                if (!await pred(item))
                    break;

                yield item;
            }
        });
    }

    skipWhile(pred: (item: T) => Awaitable<unknown>) {
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

    distinctBy(key: (item: T) => Awaitable<string>) {
        const seen = new Set<string>();

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

    async reduce<R>(reducer: (acc: R, item: T) => Awaitable<R>, initial: R): Promise<R>;
    async reduce<R>(reducer: (acc: R | undefined, item: T) => Awaitable<R | undefined>): Promise<R | undefined>;
    async reduce<R>(reducer: (acc: R | undefined, item: T) => Awaitable<R | undefined>, initial?: R): Promise<R | undefined> {
        let acc: R | undefined = initial;
    
        for await (let item of this.gen)
            acc = await reducer(acc, item);
    
        return acc;
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

    static recur<T>(func: (prev?: T) => Awaitable<T | undefined>) {
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
