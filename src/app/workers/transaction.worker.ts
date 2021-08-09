/// <reference lib="webworker" />

console.log('worker init!!!!!!!!!!!!!!!!')

import { TransactionProcessor } from '@app/helpers/parser';

const tp = new TransactionProcessor();

addEventListener('message', ({ data }) => {
  const { metaData, srcdata } = JSON.parse(data);
  console.log('ttttttttttttttttttt',{ tp });
  if (metaData && metaData.workerCommand) {
    const outputData = tp.transactionData(srcdata, metaData.workerCommand);
    const response = JSON.stringify(outputData);
    postMessage(response);
  } else {
    postMessage(JSON.stringify({ error: 'metaData.workerCommand is undefined' }));
  }
});
