import { add, dotMultiply, multiply, transpose } from "mathjs";

import { matrixData } from "./organizeData.js";

export const reconstructPcaCoordinate = ({ pcaProxyObj, continousKeys, pcCordinate }) => {
  const zCor = continousKeys.map((_, index) => pcCordinate[index] || 0);
  const rotationMatrix = matrixData(
    pcaProxyObj.values[1].values,
    continousKeys.length,
    continousKeys.length,
  );
  const scaleVec = pcaProxyObj.values[3].values;
  const centerVec = pcaProxyObj.values[2].values;

  return add(
    dotMultiply(scaleVec, multiply(zCor, transpose(rotationMatrix))),
    centerVec,
  );
};

export const getConditionPointState = ({
  usePCA,
  keys,
  continousKeys,
  reconstructedCoordinate,
  sliderPoint,
}) => {
  const conditionPointObj = usePCA
    ? {
        ...sliderPoint, // PCA only process continous covariates
        ...Object.fromEntries(
          continousKeys.map((key, index) => [key, reconstructedCoordinate[index]]),
        ),
      }
    : sliderPoint;

  const conditionPoint = keys.map((key) => conditionPointObj[key]);

  return { conditionPoint, conditionPointObj };
};

export const createPcaClickHandler = ({ pcaFormNode, formNode }) => (eventData) => {
  const point = eventData.points[0];

  pcaFormNode.children[0].value = point.x;
  pcaFormNode.children[1].value = point.y;
  pcaFormNode.children[2].value = point.z;

  pcaFormNode.dispatchEvent(new Event("input", { bubbles: true }));
  formNode.dispatchEvent(new Event("input", { bubbles: true }));
};
