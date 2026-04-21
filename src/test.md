---
title: Test Page
toc: false
---

```js
import { WebR } from "webr";

const webR = new WebR();
await webR.init();
await webR.installPackages(["quadprog", "np"]);

console.log(webR);

// webr::mount(
//     mountpoint = "/library",
//     source = "https://jeffreyracine.r-universe.dev"
//     )
await webR.evalR(`
    webr::install('np')
    
    
    set.seed(123)

    n <- 500
    x <- runif(n, -3, 3)

    # Heteroskedastic noise
    sigma <- 0.3 + 0.2 * abs(x)
    y <- sin(x) + rnorm(n, 0, sigma)

    library(np)
    model_np <- npcdens(y ~ x)

`);
```
