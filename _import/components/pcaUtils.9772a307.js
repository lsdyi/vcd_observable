import { add, dotMultiply, multiply, transpose } from "../../_node/mathjs@undefined/index.7496a740.js";

import { matrixData } from "./organizeData.e4ace3b1.js";

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
  showPCA,
  keys,
  reconstructedCoordinate,
  sliderPoint,
}) => {
  const conditionPointObj =
    showPCA.id === 0
      ? Object.fromEntries(keys.map((key, index) => [key, reconstructedCoordinate[index]]))
      : sliderPoint;

  const conditionPoint =
    showPCA.id === 0 ? reconstructedCoordinate : Object.values(conditionPointObj);

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
