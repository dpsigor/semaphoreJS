import {
  Subject,
  zip,
} from 'rxjs';
import {
  map,
} from 'rxjs/operators';

// COMO TIPAR apiFetcher DE FORMA QUE fn2 ACEITE COMO ARGS SÓ O return DE fn1?
// Digamos que eu tenha f3, que depois tem de chamar f4, e assim por diante...
// O que todos os fN tem em comum é que chamam a mesma API.

const apiFetcher = new Subject<{ args: any, fn1: Function, fn2: Function }>();
const semaphore = new Subject<void>();
// Subscriptions
zip(apiFetcher, semaphore).pipe(
  map(([{ args, fn1, fn2 }]) => fn1(args).then(r => {
    semaphore.next();
    fn2(r);
  })),
).subscribe();


// reqAPI nunca tem concurrency > concur
const concur = 3;
async function reqAPI(arg: number): Promise<string> {
  await new Promise<void>(r => setTimeout(() => r(), Math.round(Math.random() * 1000)));
  return String(arg);
}

type ACEITA_QUALQUER_COISA = null // Na linha 38 deveria reclamar que `salvarDB` não aceita o return de `reqAPI`
async function salvarDB(arg: ACEITA_QUALQUER_COISA) {
  console.log('salvando', arg);
}

async function teste(n: number, offset: number, tout: number) {
  await new Promise<void>(r => setTimeout(() => r(), tout));
  const args: number[] = [];
  for (let i = 0 + offset; i < n + offset; i++) args.push(i);
  args.forEach(arg => apiFetcher.next({ args: [arg], fn1: reqAPI, fn2: salvarDB }));
}

console.log('---------------');
(async (n: number) => {
  // Bufferiza o semáforo. Faz `concur` reqs de uma vez, e então só faz mais um após um dos reqs responder
  for (let i = 0; i < concur; i++) semaphore.next();
  teste(n, 0, 0);
  teste(n, 1e3, 5 * 1e3);
})(12);
