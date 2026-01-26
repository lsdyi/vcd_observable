import * as tf from '@tensorflow/tfjs';

// Example: Poisson regression (y ~ x)
const X = tf.tensor2d([1, 2, 3, 4, 5], [5, 1]);
const y = tf.tensor2d([1, 1, 2, 3, 5], [5, 1]);

const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, inputShape: [1], activation: 'softplus' })); // softplus ~ exp for Poisson

model.compile({
    optimizer: tf.train.adam(0.1),
    loss: "poisson", // Poisson likelihood
});

async function train() {
    await model.fit(X, y, { epochs: 200 });
    const pred = model.predict(tf.tensor2d([6, 7, 8], [3, 1]));
    pred.print();
    model.summary()

    model.weights.forEach(w => {
        console.log(w.name);
        w.val.print();
        console.log("-----------");
    });
}

train();