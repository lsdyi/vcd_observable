---
title: Visualizing conditional distributions
---

<h1>Visualizing conditional distributions</h1>
<title>Visualizing conditional distributions</title>

Process
- load dataset
- select model
- select conditional data
- plot predictive distribution 
- plot observed data dist
- plot selected data dist
- data generating process

<h2>Load Dataset</h2>

```js
const creditCard = FileAttachment('./data/AER_credit_card_data.csv').csv({typed: true});
```
```js
Inputs.table(creditCard)
```

<h2>Select Model</h2>
<select name="cars" id="cars">
  <option value="volvo">Volvo</option>
  <option value="saab">Saab</option>
  <option value="mercedes">Mercedes</option>
  <option value="audi">Audi</option>
</select>

```js
// cant use dataset right now, its async
const ebay = FileAttachment('./data/ebay.csv').csv({typed: true}); 

// active ~ age + income + expenditure + owner + selfemp + dependents + months"
import ml_pois_reg from "./components/possionReg.js";
const data = creditCard.map(item => {
  return {
    y: item.active,
    x: item.income
  }
})
const param = ml_pois_reg(data)
display(param)
display(data)
```
```js
Inputs.table(ebay)
const data = ebay.map(item => {
  return {
    y: item.NBidders,
    x: item.ReservePriceFrac
  }
})
const param = ml_pois_reg(data)
display(param)
```