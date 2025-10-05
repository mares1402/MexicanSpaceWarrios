const express = require('express');
const multer = require('multer');
const tf = require('@tensorflow/tfjs-node');
const app = express();
const upload = multer();

let model;
const loadModel = async () => {
  model = await tf.loadLayersModel('file://modelo_vegetacion/model.json'); 
};

loadModel();

app.post('/predecir', upload.single('imagen'), async (req, res) => {
  const buffer = req.file.buffer;
  const imageTensor = tf.node.decodeImage(buffer,3)
      .resizeNearestNeighbor([128,128])
      .div(tf.scalar(255))
      .expandDims(0)
      .expandDims(1);

  const prediction = model.predict(imageTensor);
  const predImg = prediction.squeeze().mul(255).cast('int32');
  const encodedImg = await tf.node.encodeJpeg(predImg);
  
  res.set('Content-Type', 'image/jpeg');
  res.send(encodedImg);
});

app.listen(3000, () => {
  console.log('API corriendo en puerto 3000');
});
