const fc = require('fast-check');
const min = new Date("2024-06-16T00:00:00.000Z");
const max = new Date("2024-06-17T00:00:00.000Z");
const arb = fc.integer({ min: min.getTime(), max: max.getTime() }).map(t => new Date(t));
for (let i = 0; i < 100000; i++) {
  const d = fc.sample(arb, 1)[0];
  if (isNaN(d.getTime())) {
    console.log('Failing value:', d);
    process.exit(1);
  }
}
console.log('Success 100000');
