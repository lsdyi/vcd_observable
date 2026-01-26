import optimjs from 'optimization-js';
import * as mathjs from 'mathjs';

function geomean_like_reg(data, beta){
  const probs = data.map(d => (Math.exp(-Math.exp(beta[0] + beta[1]*d.x))*Math.exp(beta[0] + beta[1]*d.x)**d.y)/mathjs.factorial(d.y));
  const logprobs = probs.map(d => Math.log(d))
  return Math.exp(mathjs.mean(logprobs))
}

// get mle for pois regression
const ml_pois_reg = function (data) {
    var fnc = function (param) {
        return -geomean_like_reg(data, param);
    }
    const optres = optimjs.minimize_Powell(fnc, [0, 0]);
    return optres.argument
}

export default ml_pois_reg