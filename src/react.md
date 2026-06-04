---
title: React
toc: false
---

```js
const text = view(Inputs.text());
console.log("1");
```

```js
const mu = Mutable("");
const setMu = (newValue) => {
  // if (!_.isEqual(newValue, mu.value)) {
  mu.value = newValue;
  // }
};
```

```js
display(mu);
console.log("5");
```

```js
// display(mu);

display(text);
console.log("2");

let demo = "demo";
setTimeout(() => {
  console.log("4");
  demo = text + 1;
  setMu(1);
}, 3000);

const text1 = text + 1;
```

```js
display(text1)
```

```js
console.log("2222");
display(text);
```

```js
import _ from "lodash";

console.log("3");
```
